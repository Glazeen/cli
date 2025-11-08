#!/usr/bin/env node

import { log, outro } from "@clack/prompts";
import { Command } from "commander";
import { registerAllCommands } from "./utils/register-commands";
import packageJson from "../package.json";
import { renderTitle } from "./utils/styling";
import * as cache from "./lib/cache";

async function main() {
    renderTitle();

    const program = new Command()
        .name(packageJson.name)
        .description(packageJson.description)
        .version(packageJson.version);

    await registerAllCommands(program);

    // init the cache
    await cache.init();
    await program.parseAsync(process.argv);

    outro("👋 Done");
}

main().catch((err) => {
    log.error(`Unexpected error: ${(err as Error).message}`);
    process.exit(1);
});
