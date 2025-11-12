import path from "path";
import { Command } from "commander";
import { select } from "@clack/prompts";
import { getTemplates } from "../lib/cache";
import { COMMAND_POOL, runPostCreateActions } from "../lib/postprocessor";
import { scaffold } from "../lib/scaffolding-engine";
import { configureOutput, logger, showFinalSummary } from "../ui";
import { prompter } from "../ui/prompter";

const commandConfiguration = {
    name: "create",
    description: "Create a new Glazeen project"
};

const handler = async (projectName: string) => {
    const startTime = process.hrtime();

    const templates = await getTemplates();

    const selectedTemplate = await select({
        message: "What template would you like to use?",
        options: templates.map((template) => ({
            value: template.config.name,
            label: template.config.name,
            hint: template.config.description
        }))
    });

    const template = templates.find(
        (template) => template.config.name === selectedTemplate
    );

    configureOutput({
        nextSteps: template?.config.next_steps || []
    });

    const config = template?.config;

    const variables: Record<string, string> = {};
    const commands: string[] = [];

    for (let prompt of config?.prompts || []) {
        const { commands: cmds, variables: vars } = await prompter(prompt);

        commands.push(...cmds);
        Object.assign(variables, vars);
    }

    COMMAND_POOL.push(...(template?.config.post_create || []));
    COMMAND_POOL.push(...commands.map((command) => ({ command })));

    await scaffold(
        template?.path || "",
        path.join(process.cwd(), projectName),
        variables
    );
    logger.success("Template files copied");

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
