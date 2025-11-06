import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { Command } from "commander";
import { info, bold } from "./styling";

export async function registerAllCommands(program: Command): Promise<void> {
    const isDev = __filename.endsWith(".ts");
    const commandsDir = path.join(__dirname, "..", "commands");

    if (!fs.existsSync(commandsDir)) {
        return;
    }

    const entries = fs.readdirSync(commandsDir, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name);
        const base = path.basename(entry.name, ext);

        if (base === "types" || entry.name.endsWith(".d.ts")) continue;
        if (isDev ? ext !== ".ts" : ext !== ".js") continue;

        const filePath = path.join(commandsDir, entry.name);
        const fileUrl = pathToFileURL(filePath).href;

        try {
            // prevent TS from transpiling to require()
            const dynamicImport = new Function("p", "return import(p)") as (
                p: string
            ) => Promise<any>;
            const mod = await dynamicImport(fileUrl);

            const register =
                typeof mod.register === "function"
                    ? mod.register
                    : typeof mod.default?.register === "function"
                    ? mod.default.register
                    : undefined;

            if (register) {
                register(program);
                console.log(
                    `${info} Loaded command: ${bold(
                        entry.name.replace(/\.(ts|js)$/, "")
                    )}`
                );
            }
        } catch (err) {
            console.error(
                `Failed to load command module "${entry.name}": ${
                    (err as Error).message
                }`
            );
        }
    }
}
