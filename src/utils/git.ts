import { SimpleGit, simpleGit } from "simple-git";
import { GLOBAL_CACHE_PATH } from "../lib/cache";
import path from "path";

let __instance: SimpleGit;

export const git = () => {
    if (__instance === undefined) {
        __instance = simpleGit({
            baseDir: path.join(GLOBAL_CACHE_PATH, ".boilerplates")
        });
    }

    return __instance;
};
