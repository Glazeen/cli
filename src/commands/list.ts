import { Command } from "commander";
import { getTemplates } from "../lib/cache";
import { logger } from "../ui";
import chalk from "chalk";

const commandConfiguration = {
    name: "list",
    description: "Lists all available templates."
};

const handler = async () => {
    const spinner = logger
        .nl()
        .spinner("📚 Fetching available templates...")
        .start();

    const templates = await getTemplates();

    if (templates.length === 0) {
        spinner.fail("❌ No templates found.");
        return;
    }

    const lines = templates.map((tpl) =>
        [
            `• ${chalk.bold(chalk.underline(tpl.config.name))}`,
            `   ${chalk.dim(tpl.config.description)}`
        ].join("\n")
    );

    spinner.succeed(`${chalk.bold("Templates List")}\n${lines.join("\n")}`);
    logger.nl();
};

export function register(program: Command) {
    program
        .command(commandConfiguration.name)
        .description(commandConfiguration.description)
        .action(handler);
}
