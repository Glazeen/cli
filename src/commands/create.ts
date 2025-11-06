import { Command } from "commander";
import { success, bold } from "../utils/styling";
import { log } from "@clack/prompts";

const commandConfiguration = {
    name: "create",
    description: "Create a new Glazeen project"
};

const handler = (projectName: string) => {
    log.info(`${success} Project ${bold(projectName)} created successfully!`);
};

export function register(program: Command) {
    program
        .command(commandConfiguration.name)
        .description(commandConfiguration.description)
        .argument("<project-name>", "The name of the project to create.")
        .action(handler);
}
