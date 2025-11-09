import envPaths from "env-paths";
import path from "path";

export const GLOBAL_CACHE_PATH = path.join(
    envPaths("@glazeen-cli").cache,
    "git"
);
