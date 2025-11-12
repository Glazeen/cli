import path from "path";
import { Command } from "commander";
import { log, select, text, confirm } from "@clack/prompts";
import { getTemplates } from "../lib/cache";
import { COMMAND_POOL, runPostCreateActions } from "../lib/postprocessor";
import { scaffold } from "../lib/scaffolding-engine";
import { logger } from "../ui";
import chalk from "chalk";

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
        let response;
        switch (prompt.type) {
            case "text":
                response = await text({
                    message: prompt.message,
                    defaultValue: prompt.default,
                    placeholder: prompt.default
                });

                variables[prompt.key!] = response as string;
                break;

            case "confirm":
                response = await confirm({
                    message: prompt.message
                });

                if (response) {
                    if (
                        prompt.choices?.Yes &&
                        prompt.choices?.Yes?.length > 0
                    ) {
                        typeof prompt.choices?.Yes === "string"
                            ? commands.push(prompt.choices.Yes)
                            : commands.push(...(prompt.choices?.Yes || []));
                    }

                    variables[prompt.key!] = "Yes";
                } else {
                    if (prompt.choices?.No && prompt.choices?.No?.length > 0) {
                        typeof prompt.choices?.No === "string"
                            ? commands.push(prompt.choices.No)
                            : commands.push(...(prompt.choices?.No || []));
                    }
                    variables[prompt.key!] = "No";
                }

                break;

            // case "select":
            //     response = await select({
            //         message: prompt.message,
            //         options: Object.keys(prompt.choices || {}).map(([key]) => ({
            //             value: key,
            //             label: key
            //         }))
            //     });
        }
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
