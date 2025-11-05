import { Command } from "commander";
import { info, bold } from "../utils/styling";

const commandConfiguration = {
    name: "list",
    description: "Lists all available templates."
};

const handler = () => {
    console.log(`${info} Fetching available templates...`);
    // TODO: Implement logic to fetch and display templates from the repository.
    console.log(`  - ${bold("microservice-express")}`);
    console.log(`  - ${bold("nextjs-webapp")}`);
    console.log(`  - ${bold("python-venv")}`);
};

export function register(program: Command) {
    program
        .command(commandConfiguration.name)
        .description(commandConfiguration.description)
        .action(handler);
}
