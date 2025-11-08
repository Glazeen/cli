import { Command } from "commander";
import { bold, info, underline, sectionTitle } from "../utils/styling";
import { log } from "@clack/prompts";
import { getTemplates } from "../lib/cache";

const commandConfiguration = {
    name: "list",
    description: "Lists all available templates."
};

const handler = async () => {
    log.info(`${info} Fetching available templates...`);

    const templates = await getTemplates();

    if (templates.length === 0) {
        log.error("No templates found.");
        return;
    }

    const lines = templates.map(
        (line) =>
            `👉 ${bold(underline(line.config.name))}\n\t${
                line.config.description
            }`
    );

    log.info(sectionTitle("TEMPLATE LIST") + "\n" + lines.join("\n"));
};

export function register(program: Command) {
    program
        .command(commandConfiguration.name)
        .description(commandConfiguration.description)
        .action(handler);
}
