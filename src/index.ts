#!/usr/bin/env node

import "./lib/cleanup";
import * as p from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";
import { description, version } from "../package.json";
import * as create from "./commands/create";
import * as list from "./commands/list";
import { intro, setVerbose } from "./ui";
import { printBanner, WEBSITE } from "./ui/brand";

const program = new Command()
    .name("@glazeen/cli")
    .description(description)
    .version(version)
    .option("--verbose", "show detailed logs")
    .addHelpText("after", `\nLearn more at ${WEBSITE}`)
    .hook("preAction", (_, actionCommand) => {
        setVerbose(Boolean(program.opts().verbose));
        if (actionCommand.name() === "create") printBanner();
        intro(version);
    });

create.register(program);
list.register(program);

program.parseAsync().catch((error: Error) => {
    p.log.error(`Unexpected error: ${error.message}`);
    if (program.opts().verbose && error.stack) p.log.message(pc.dim(error.stack));
    p.outro(pc.red("Failed"));
    process.exit(1);
});
