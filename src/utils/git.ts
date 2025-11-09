import { SimpleGit, simpleGit } from "simple-git";
import { GLOBAL_CACHE_PATH } from "../lib/cache";
import path from "path";

export const git = simpleGit({
    baseDir: path.join(GLOBAL_CACHE_PATH, ".boilerplates")
});
