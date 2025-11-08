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

    // if the cache folder is empty clone the boilerplates repo with simplegit
    if (fs.readdirSync(GLOBAL_CACHE_PATH).length === 0) {
        s.message(`${info} Cloning boilerplates repo to ${GLOBAL_CACHE_PATH}`);
        await git().clone("https://github.com/Glazeen/.boilerplates");
    }

    const fetch = await git().fetch();

    if (fetch.updated.length > 0) {
        s.message(`${info} Pulling latest changes from remote`);
        await git().pull();
    }

    s.stop(`${info} Cache initialized.`);
};
