import * as p from "@clack/prompts";
import { Command } from "commander";
import path from "path";
import pc from "picocolors";
import { defaultCatalog, loadTemplates } from "../lib/catalog";
import { parseSource } from "../lib/source";
import { fail } from "../ui";
import { accent } from "../ui/brand";

const handler = async (input: string | undefined, { refresh }: { refresh?: boolean }) => {
    const source = input ? parseSource(input) : defaultCatalog();
    if (!source) {
        return fail(
            `${accent(input!)} is not a valid template source.`,
            "Use a GitHub repository (owner/repo), a git URL or a local path."
        );
    }

    const templates = await loadTemplates(source, { isDefault: !input, refresh });

    for (const template of templates) {
        const folder = path.basename(template.path);
        const alias = folder !== template.config.name && templates.length > 1 ? pc.dim(` (${folder})`) : "";
        p.log.message(
            `${pc.bold(accent(template.config.name))}${alias}` +
                (template.config.description ? `\n${pc.dim(template.config.description)}` : "")
        );
    }

    const example = input ? `-t ${input}` : `-t ${templates[0].config.name}`;
    p.outro(`Use one with ${accent(`npx glazeen create my-app ${example}`)}`);
};

export function register(program: Command) {
    program
        .command("list")
        .description("List the available templates (or the templates in a repository or folder)")
        .argument("[source]", "GitHub repository (owner/repo), git URL or local path")
        .option("--refresh", "check for template updates even if the cache is recent")
        .action(handler);
}
