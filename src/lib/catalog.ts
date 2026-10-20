import * as p from "@clack/prompts";
import fs from "fs";
import path from "path";
import pc from "picocolors";
import { Template } from "../types";
import { debug, fail, formatDuration } from "../ui";
import { accent } from "../ui/brand";
import { syncRepo } from "./cache";
import { GitError } from "./git";
import { DEFAULT_TEMPLATES_REPO, parseSource, Source } from "./source";
import { CONFIG_FILE, discoverTemplates } from "./templates";

/** How long the default catalog is used from cache before checking for updates */
const CATALOG_MAX_AGE = 60 * 60 * 1000;

export interface LoadOptions {
    /** Force a refresh of the default catalog, ignoring CATALOG_MAX_AGE */
    refresh?: boolean;
}

/** The default catalog: the official templates, or `GLAZEEN_TEMPLATES_REPO` when set */
export const defaultCatalog = () => {
    const input = process.env.GLAZEEN_TEMPLATES_REPO || DEFAULT_TEMPLATES_REPO;
    const source = parseSource(input);
    if (!source) fail(`GLAZEEN_TEMPLATES_REPO is not a valid template source: "${input}"`);
    return source!;
};

const errorDetails = (error: unknown) =>
    error instanceof GitError ? [error.message, error.output] : [(error as Error).message];

/**
 * Fetches (or reads) a template source and returns the templates it contains,
 * reporting progress as a single spinner step. Exits on unrecoverable errors.
 */
export const loadTemplates = async (
    source: Source,
    { isDefault = false, refresh = false }: LoadOptions & { isDefault?: boolean } = {}
): Promise<Template[]> => {
    const isOfficial = isDefault && !process.env.GLAZEEN_TEMPLATES_REPO;
    const label = accent(isOfficial ? "official templates" : source.label);
    const spinner = p.spinner();
    let root: string;
    let note = "";
    // Logging while the spinner is running would garble it, so verbose details are printed afterwards
    const details: string[] = [];

    if (source.kind === "local") {
        spinner.start(`Reading ${label}`);
        root = source.dir;
        if (!fs.existsSync(root)) {
            spinner.error(`Folder not found: ${label}`);
            return fail("Check the path and try again.");
        }
    } else {
        spinner.start(`Fetching ${label}`);
        const startedAt = performance.now();
        try {
            const result = await syncRepo(source, { maxAge: isDefault && !refresh ? CATALOG_MAX_AGE : 0 });
            root = result.dir;
            details.push(`Cache ${result.status}: ${result.dir} (${formatDuration(performance.now() - startedAt)})`);
            if (result.status === "fresh") note = pc.dim(" (cached)");
            if (result.status === "stale") {
                note = pc.yellow(" (offline copy)");
                details.push(...errorDetails(result.error));
            }
        } catch (error) {
            spinner.error(`Could not fetch ${label}`);
            return fail(
                "Make sure the repository exists and you have access to it (private repositories need git credentials).",
                errorDetails(error)
            );
        }
        if (source.subpath) {
            root = path.join(root, source.subpath);
            if (!fs.existsSync(root)) {
                spinner.error(`Folder "${source.subpath}" not found in ${label}`);
                return fail("Check the path inside the repository and try again.");
            }
        }
    }

    const { templates, invalid } = await discoverTemplates(root);

    if (templates.length === 0) {
        spinner.error(`No valid templates found in ${label}`);
        if (invalid.length === 1) {
            return fail(invalid[0].message, invalid[0].issues.map((issue) => `- ${issue}`));
        }
        if (invalid.length) {
            return fail(
                `${invalid.length} templates have an invalid ${CONFIG_FILE}`,
                invalid.flatMap((error) => [
                    accent(path.basename(error.templateDir)),
                    ...error.issues.map((issue) => `  - ${issue}`),
                ])
            );
        }
        return fail(
            `No ${CONFIG_FILE} found.`,
            "Looked in the root folder and in each of its direct subfolders."
        );
    }

    const count = `${templates.length} ${isOfficial ? "official " : ""}template${templates.length === 1 ? "" : "s"}`;
    spinner.stop(`Found ${count}${isOfficial ? "" : ` in ${label}`}${note}`);
    if (details.length) debug(details.join("\n"));

    for (const error of invalid) {
        const issues = error.issues.map((issue) => `- ${issue}`).join("\n");
        p.log.warn(
            `Skipped ${accent(path.basename(error.templateDir))}: invalid ${CONFIG_FILE}\n${pc.dim(issues)}`
        );
    }

    return templates;
};
