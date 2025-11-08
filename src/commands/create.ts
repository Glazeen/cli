import { Command } from "commander";
import { success, bold } from "../utils/styling";
import { log, select, text, confirm } from "@clack/prompts";
import { getTemplates } from "../lib/cache";
import { COMMAND_POOL } from "../lib/postprocessor";

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

    const config = templates.find(
        (template) => template.config.name === selectedTemplate
    )?.config;

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
                break;

            case "confirm":
                response = await confirm({
                    message: prompt.message
                });

                if (response) {
                    typeof prompt.choices?.Yes === "string"
                        ? commands.push(prompt.choices.Yes)
                        : commands.push(...(prompt.choices?.Yes || []));
                } else {
                    typeof prompt.choices?.No === "string"
                        ? commands.push(prompt.choices.No)
                        : commands.push(...(prompt.choices?.No || []));
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

        COMMAND_POOL.push(...commands);
    }

    log.info(`${success} Project ${bold(projectName)} created successfully!`);
};

export function register(program: Command) {
    program
        .command(commandConfiguration.name)
        .description(commandConfiguration.description)
        .argument("<project-name>", "The name of the project to create.")
        .action((args) => handler(args).then(() => process.exit(0)));
}
