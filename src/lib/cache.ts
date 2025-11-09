import fs from "fs";
import path from "path";
import envPaths from "env-paths";
import { git } from "../utils/git";
import { spinner } from "@clack/prompts";
import { info } from "../utils/styling";

export const GLOBAL_CACHE_PATH = path.join(
    envPaths("@glazeen-cli").cache,
    "git"
);

export const init = async () => {
    const s = spinner({ indicator: "timer" });
    s.start(`${info} Initializing cache`);
    if (!fs.existsSync(GLOBAL_CACHE_PATH)) {
        fs.mkdirSync(GLOBAL_CACHE_PATH, { recursive: true });
    }

    // Ensure the repo directory exists before using simple-git
    const repoDir = path.join(GLOBAL_CACHE_PATH, ".boilerplates");
    if (!fs.existsSync(repoDir)) {
        fs.mkdirSync(repoDir, { recursive: true });
    }

    // Clone into the current directory (.) so the repo is at repoDir
    if (!fs.existsSync(path.join(repoDir, ".git"))) {
        s.message(`${info} Cloning boilerplates repo to ${repoDir}`);
        await git.clone("https://github.com/Glazeen/.boilerplates", ".");
    } else {
        const fetch = await git.fetch();
        if (fetch.updated.length > 0) {
            s.message(`${info} Pulling latest changes from remote`);
            await git.pull();
        }
    }

    s.stop(`${info} Cache initialized.`);
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
    const templates = filteredTemplatesFolders.map((folder) => ({
        path: path.join(GLOBAL_CACHE_PATH, ".boilerplates", folder.name),
        config: JSON.parse(
            fs.readFileSync(
                path.join(
                    GLOBAL_CACHE_PATH,
                    ".boilerplates",
                    folder.name,
                    "glazeen.config.json"
                ),
                "utf-8"
            )
        ) as GlazeenConfig
    }));

    return templates;
};
