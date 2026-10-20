import fs from "fs";
import path from "path";
import type Handlebars from "handlebars";
import { TemplateVariables } from "../types";
import { CONFIG_FILE } from "./templates";

/** Never copied into the generated project */
const IGNORED = new Set([CONFIG_FILE, ".git", "node_modules"]);

export class TemplateRenderError extends Error {
    constructor(
        readonly file: string,
        readonly reason: Error
    ) {
        super(`Error processing template file ${file}`);
    }
}

const missingVariable = (name: string, line?: string) =>
    new Error(
        `Variable "${name}" is missing${line ? ` (line ${line})` : ""}. Did you forget to add it to your prompts?`
    );

/**
 * Strict mode only checks `{{variable}}`, not helper arguments, so a typo in
 * `{{#if typo}}` would silently render the else branch. Arguments are checked here instead.
 * `ids` (from `trackIds`) holds the argument's path, or a non-string for literals and sub-expressions.
 */
const assertDefined = (args: unknown[], options: any) => {
    args.forEach((value, index) => {
        const id = options.ids?.[index];
        if (value === undefined && typeof id === "string" && id) {
            throw missingVariable(id, options.loc?.start?.line);
        }
    });
};

/** Rewrites Handlebars' `"x" not defined in [object Object] - 3:4` into a readable message */
const explainError = (error: Error) => {
    const match = error.message.match(/^"(.+)" not defined in .* - (\d+):\d+$/);
    return match ? missingVariable(match[1], match[2]) : error;
};

/** Extra helpers available in `.hbs` files (all of them also accept sub-expressions as arguments) */
const helpers: Record<string, (...args: any[]) => unknown> = {
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    /** For multiselect answers (lists) or text: `(includes features "eslint")` */
    includes: (list, item) => (Array.isArray(list) || typeof list === "string" ? list.includes(item) : false),
    and: (...values) => values.every(Boolean),
    or: (...values) => values.some(Boolean),
    not: (value) => !value,
    /** Outputs a value as a JSON literal (quoted and escaped), e.g. inside package.json */
    json: (value) => JSON.stringify(value),
};

// Handlebars is only needed when scaffolding, so it is loaded lazily to keep startup fast
let handlebarsInstance: Promise<typeof Handlebars> | undefined;
const getHandlebars = () =>
    (handlebarsInstance ??= import("handlebars").then(({ default: Handlebars }) => {
        const handlebars = Handlebars.create();

        for (const [name, helper] of Object.entries(helpers)) {
            handlebars.registerHelper(name, (...args: unknown[]) => {
                const options = args.pop();
                assertDefined(args, options);
                return helper(...args);
            });
        }

        // Make the built-in block helpers as strict as plain `{{variable}}` lookups
        for (const name of ["if", "unless", "each", "with"]) {
            const builtin = handlebars.helpers[name] as (...args: unknown[]) => unknown;
            handlebars.registerHelper(name, function (this: unknown, ...args: any[]) {
                assertDefined(args.slice(0, -1), args[args.length - 1]);
                return builtin.apply(this, args);
            });
        }

        return handlebars;
    }));

/**
 * Copies `templateDir` into `targetDir`, rendering `*.hbs` files with `variables`. Returns the number of files written.
 * `skip` holds paths relative to the template folder (with `/`) that are left out, e.g. `prisma` or `prisma.config.ts`.
 * A skipped folder skips its whole content and a skipped `x.ts` also skips `x.ts.hbs`.
 */
export async function scaffold(
    templateDir: string,
    targetDir: string,
    variables: TemplateVariables,
    skip: ReadonlySet<string> = new Set(),
    root = templateDir
): Promise<number> {
    const handlebars = await getHandlebars();
    const [items] = await Promise.all([
        fs.promises.readdir(templateDir, { withFileTypes: true }),
        fs.promises.mkdir(targetDir, { recursive: true }),
    ]);

    const isSkipped = (sourcePath: string) => {
        const relative = path.relative(root, sourcePath).split(path.sep).join("/");
        return skip.has(relative) || (relative.endsWith(".hbs") && skip.has(relative.slice(0, -".hbs".length)));
    };

    // Siblings are independent, so process them concurrently
    const counts = await Promise.all(
        items
            .filter((item) => !IGNORED.has(item.name) && !isSkipped(path.join(templateDir, item.name)))
            .map(async (item) => {
                const sourcePath = path.join(templateDir, item.name);
                const targetPath = path.join(targetDir, item.name);

                if (item.isDirectory()) {
                    return scaffold(sourcePath, targetPath, variables, skip, root);
                }

                if (!item.name.endsWith(".hbs")) {
                    await fs.promises.copyFile(sourcePath, targetPath);
                    return 1;
                }

                try {
                    const [content, { mode }] = await Promise.all([
                        fs.promises.readFile(sourcePath, "utf-8"),
                        fs.promises.stat(sourcePath),
                    ]);
                    // noEscape: the output is source code, not HTML, so `'` must not become `&#x27;`
                    const template = handlebars.compile(content, { strict: true, trackIds: true, noEscape: true } as any);
                    // Keep the permissions (e.g. the executable bit of `run.sh.hbs`)
                    await fs.promises.writeFile(targetPath.slice(0, -".hbs".length), template(variables), { mode });
                    return 1;
                } catch (error) {
                    throw new TemplateRenderError(path.relative(root, sourcePath), explainError(error as Error));
                }
            })
    );

    return counts.reduce((sum, count) => sum + count, 0);
}
