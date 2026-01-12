#!/usr/bin/env node

import { Command, Option } from "commander";
import { registerAllCommands } from "./utils/register-commands";
import packageJson from "../package.json";
import * as cache from "./lib/cache";
import { configureOutput, logger } from "./ui/";

async function main() {
    logger.intro();

    const program = new Command()
        .name(packageJson.name)
        .addOption(new Option("--verbose", "Enable verbose logging"))
        .allowExcessArguments(true)
        .description(packageJson.description)
        .version(packageJson.version);

    const options = program.parseOptions(process.argv).operands;
    configureOutput({
        verbosity: options.find((o) => o === "--verbose") ? "verbose" : "normal"
    });

    await registerAllCommands(program);

    // Provide a consistent setup section with multi-line info (verbose)
    logger
        .verbose(
            [
                "",
                "🔧 Preparing environment...",
                `🧭 Version: ${packageJson.version}`,
                `📦 Registered commands: ${program.commands.length}`,
            ].join("\n")
        ).nl()

    // init the cache
    await cache.init();
    await program.parseAsync(process.argv);

    logger.success("👋 Done");
}

main().catch((err) => {
    logger.error(`Unexpected error: ${(err as Error).message}`);
    process.exit(1);
});
