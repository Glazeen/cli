import path from "path";
import { Command } from "commander";
import { log, select, text, confirm } from "@clack/prompts";
import { getTemplates } from "../lib/cache";
import { COMMAND_POOL, runPostCreateActions } from "../lib/postprocessor";
import { scaffold } from "../lib/scaffolding-engine";
import { logger } from "../ui";
import chalk from "chalk";
import { prompter } from "../ui/prompter";

const commandConfiguration = {
    name: "create",
    description: "Create a new Glazeen project"
};

const handler = async (projectName: string) => {
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

    logger.success(`Project ${chalk.bold(projectName)} created successfully!`);
};

export function register(program: Command) {
    program
        .command(commandConfiguration.name)
        .description(commandConfiguration.description)
        .argument("<project-name>", "The name of the project to create.")
        .action((args) => handler(args).then(() => process.exit(0)));
}
