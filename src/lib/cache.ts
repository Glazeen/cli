import fs from "fs";
import path from "path";
import { GLOBAL_CACHE_PATH } from "../utils/constants";
import { logger } from "../ui";

export const init = async () => {
    const spinner = logger.spinner(`📂 Initializing cache`).start();

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
        spinner.text = `Cloning boilerplates repo into ${repoDir}`;
        await git.clone("https://github.com/Glazeen/.boilerplates", ".");
    } else {
        spinner.text = " Pulling latest changes";
        await git.pull();
    }

    spinner.succeed(`Cache initialized`);
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
