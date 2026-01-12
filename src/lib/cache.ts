import fs from "fs";
import path from "path";
import { GLOBAL_CACHE_PATH } from "../utils/constants";
import { logger } from "../ui";
import { GlazeenConfig, GlazeenConfigSchema } from "../types";

export const init = async () => {
    const spinner = logger.spinner(` Initializing cache`).start();

    if (!fs.existsSync(GLOBAL_CACHE_PATH)) {
        fs.mkdirSync(GLOBAL_CACHE_PATH, { recursive: true });
    }

    // Ensure the repo directory exists before using simple-git
    const repoDir = path.join(GLOBAL_CACHE_PATH, ".boilerplates");
    if (!fs.existsSync(repoDir)) {
        fs.mkdirSync(repoDir, { recursive: true });
    }

    const simpleGit = (await import("simple-git")).default;
    const git = simpleGit({
        baseDir: path.join(GLOBAL_CACHE_PATH, ".boilerplates")
    });

    // Clone into the current directory (.) so the repo is at repoDir
    if (!fs.existsSync(path.join(repoDir, ".git"))) {
        spinner.text = ` Cloning boilerplates repo into ${repoDir}`;
        await git.clone("https://github.com/Glazeen/.boilerplates", ".");
    } else {
        spinner.text = " Pulling latest changes";
        await git.pull();
    }

    spinner.succeed(` Cache initialized`);
};

export const getTemplates = async () => {
    const templatesFolders = fs.readdirSync(
        path.join(GLOBAL_CACHE_PATH, ".boilerplates"),
        { withFileTypes: true }
    );

    // filter out the folders that start with a dot
    const filteredTemplatesFolders = templatesFolders.filter(
        (item) => item.isDirectory() && item.name !== ".git"
    );

    // map the folders to the config.json file
    const templates = filteredTemplatesFolders
        .map((folder) => {
            const configPath = path.join(
                GLOBAL_CACHE_PATH,
                ".boilerplates",
                folder.name,
                "glazeen.config.json"
            );

            try {
                const configRaw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
                const result = GlazeenConfigSchema.safeParse(configRaw);

                if (!result.success) {
                    logger.error(
                        `Invalid configuration in template "${folder.name}":`
                    );
                    result.error.issues.forEach((issue) => {
                        logger.error(`  - ${issue.path.join(".")}: ${issue.message}`);
                    });
                    return null;
                }

                return {
                    path: path.join(GLOBAL_CACHE_PATH, ".boilerplates", folder.name),
                    config: result.data
                };
            } catch (err) {
                logger.error(
                    `Failed to read or parse config for template "${folder.name}": ${
                        (err as Error).message
                    }`
                );
                return null;
            }
        })
        .filter((t): t is { path: string; config: GlazeenConfig } => t !== null);

    return templates;
};
