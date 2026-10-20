import fs from "fs";
import path from "path";
import { GlazeenConfigSchema, Template } from "../types";

export const CONFIG_FILE = "glazeen.config.json";

export class TemplateConfigError extends Error {
    constructor(
        readonly templateDir: string,
        readonly issues: string[]
    ) {
        super(`Invalid ${CONFIG_FILE} in "${path.basename(templateDir)}"`);
    }
}

export const loadTemplate = async (dir: string): Promise<Template> => {
    let raw: unknown;
    try {
        raw = JSON.parse(await fs.promises.readFile(path.join(dir, CONFIG_FILE), "utf-8"));
    } catch (error) {
        throw new TemplateConfigError(dir, [(error as Error).message]);
    }

    const result = GlazeenConfigSchema.safeParse(raw);
    if (!result.success) {
        throw new TemplateConfigError(
            dir,
            result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        );
    }

    // Catch typos in `files`: every listed path must exist (as is or as `.hbs`)
    const missing = result.data.prompts.flatMap((prompt, index) =>
        Object.entries(prompt.files ?? {}).flatMap(([answer, paths]) =>
            [paths]
                .flat()
                .filter((file) => file && ![file, `${file}.hbs`].some((f) => fs.existsSync(path.join(dir, f))))
                .map((file) => `prompts.${index}.files.${answer}: "${file}" does not exist in the template`)
        )
    );
    if (missing.length) throw new TemplateConfigError(dir, missing);

    return { path: dir, config: result.data };
};

/**
 * Finds the templates inside `root`: either `root` itself is a template (it contains a
 * glazeen.config.json) or each direct subfolder containing one is a template.
 */
export const discoverTemplates = async (root: string) => {
    let dirs: string[];

    if (fs.existsSync(path.join(root, CONFIG_FILE))) {
        dirs = [root];
    } else {
        const entries = await fs.promises.readdir(root, { withFileTypes: true });
        dirs = entries
            .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules")
            .map((entry) => path.join(root, entry.name))
            .filter((dir) => fs.existsSync(path.join(dir, CONFIG_FILE)));
    }

    const results = await Promise.allSettled(dirs.map(loadTemplate));

    return {
        templates: results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
        invalid: results.flatMap((r) =>
            r.status === "rejected" && r.reason instanceof TemplateConfigError ? [r.reason] : []
        ),
    };
};

/** Matches a template by its config name or folder name (case-insensitive) */
export const findTemplate = (templates: Template[], name: string) => {
    const needle = name.toLowerCase();
    return templates.find(
        (t) => t.config.name.toLowerCase() === needle || path.basename(t.path).toLowerCase() === needle
    );
};
