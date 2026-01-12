import path from "path";
import fs from "fs-extra";
import os from "os";
import { Command } from "commander";
import { select, text, isCancel, cancel } from "@clack/prompts";
import { getTemplates } from "../lib/cache";
import { COMMAND_POOL, runPostCreateActions } from "../lib/postprocessor";
import { scaffold } from "../lib/scaffolding-engine";
import { configureOutput, logger, showFinalSummary } from "../ui";
import { prompter } from "../ui/prompter";
import { GlazeenConfig, GlazeenConfigSchema } from "../types";
import chalk from "chalk";

const commandConfiguration = {
    name: "create",
    description: "Create a new Glazeen project"
};

const handler = async (projectName: string) => {
    const startTime = process.hrtime();

    const templates = await getTemplates();

    const selectedTemplate = await select({
        message: "What template would you like to use?",
        options: [
            ...templates.map((template) => ({
                value: template.config.name,
                label: template.config.name,
                hint: template.config.description
            })),
            {
                value: "github-repo",
                label: "From GitHub Repository",
                hint: "Clone a Glazeen-compatible repository"
            }
        ]
    });

    if (isCancel(selectedTemplate)) {
        cancel("Operation cancelled.");
        process.exit(0);
    }

    let config: GlazeenConfig | undefined;
    let templatePath: string | undefined;
    let tempDir: string | null = null;

    if (selectedTemplate === "github-repo") {
        const repoUrl = await text({
            message: "Enter the GitHub repository URL:",
            placeholder: "https://github.com/username/repo",
            validate: (value) => {
                if (!value) return "Please enter a URL.";
                if (!value.startsWith("http")) return "Please enter a valid URL.";
            }
        });

        if (isCancel(repoUrl)) {
            cancel("Operation cancelled.");
            process.exit(0);
        }

        const simpleGit = (await import("simple-git")).default;
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "glazeen-"));
        console.log(chalk.gray('│'))
        const spinner = logger.spinner(" Cloning repository...").start();
        try {
            await simpleGit().clone(repoUrl as string, tempDir);
            spinner.succeed(" Repository cloned");
        } catch (error) {
            spinner.fail(" Failed to clone repository");
            logger.error((error as Error).message);
            if (tempDir) await fs.remove(tempDir);
            process.exit(1);
        }
        console.log(chalk.gray('│'))
        const configPath = path.join(tempDir, "glazeen.config.json");
        if (!fs.existsSync(configPath)) {
            logger.error(" Repository does not contain a glazeen.config.json file.");
            if (tempDir) await fs.remove(tempDir);
            process.exit(1);
        }

        try {
            const configRaw = JSON.parse(await fs.readFile(configPath, "utf-8"));
            const result = GlazeenConfigSchema.safeParse(configRaw);

            if (!result.success) {
                logger.error(" Invalid configuration in remote repository (`glazeen.config.json`):");
                result.error.issues.forEach((issue) => {
                    logger.error(`    - ${issue.path.join(".")}: ${issue.message}`);
                });
                if (tempDir) await fs.remove(tempDir);
                process.exit(1);
            }

            config = result.data;
            templatePath = tempDir;

            logger.success(` Valid template found: ${config.name}`);
        } catch (error) {
            logger.error(` Failed to parse glazeen.config.json: ${(error as Error).message}`);
            if (tempDir) await fs.remove(tempDir);
            process.exit(1);
        }
    } else {
        const template = templates.find(
            (template) => template.config.name === selectedTemplate
        );
        config = template?.config;
        templatePath = template?.path;
    }

    if (!config || !templatePath) {
        logger.error(" Template configuration not found.");
        process.exit(1);
    }

    configureOutput({
        nextSteps: config.next_steps || []
    });

    const variables: Record<string, string> = {};
    const commands: string[] = [];

    for (let prompt of config.prompts || []) {
        const { commands: cmds, variables: vars } = await prompter(prompt);

        commands.push(...cmds);
        Object.assign(variables, vars);
    }

    COMMAND_POOL.push(...(config.post_create || []));
    COMMAND_POOL.push(...commands.map((command) => ({ command })));

    await scaffold(
        templatePath,
        path.join(process.cwd(), projectName),
        variables
    );
    logger.success(" Template files copied");

    // Cleanup temp dir if used
    if (tempDir) {
        await fs.remove(tempDir);
    }

    await runPostCreateActions(path.join(process.cwd(), projectName));

    showFinalSummary({
        executionTime: startTime,
        commands: COMMAND_POOL.map((command) => ({
            name: command.command,
            startTime: process.hrtime()
        })),
        projectName
    });
};

export function register(program: Command) {
    program
        .command(commandConfiguration.name)
        .description(commandConfiguration.description)
        .argument("<project-name>", "The name of the project to create.")
        .action((args) => handler(args).then(() => process.exit(0)));
}
