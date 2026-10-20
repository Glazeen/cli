import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { GLOBAL_CACHE_PATH } from "../utils/constants";
import { removeOnExit } from "./cleanup";
import { shallowClone, shallowUpdate } from "./git";
import { DEFAULT_TEMPLATES_REPO, Source } from "./source";

type GitSource = Extract<Source, { kind: "git" }>;

export type SyncResult =
    | { dir: string; status: "cloned" | "updated" | "fresh" }
    /** The update failed (e.g. offline) but a previously cached copy is available */
    | { dir: string; status: "stale"; error: unknown };

const SYNC_MARKER = path.join(".git", "glazeen-last-sync");

const cacheDirFor = (source: GitSource) => {
    // Keep the historical location for the official catalog so existing caches are reused
    if (source.url.replace(/\.git$/, "") === DEFAULT_TEMPLATES_REPO && !source.ref) {
        return path.join(GLOBAL_CACHE_PATH, ".boilerplates");
    }

    const id = `${source.url}#${source.ref ?? ""}`;
    const readable = source.url
        .replace(/^[a-z]+:\/\/|^[\w.-]+@/i, "")
        .replace(/\.git$/, "")
        .replace(/[^\w.-]+/g, "-")
        .slice(-60);
    const hash = createHash("sha1").update(id).digest("hex").slice(0, 8);
    return path.join(GLOBAL_CACHE_PATH, `${readable}-${hash}`);
};

const lastSync = (dir: string) => {
    try {
        return Number(fs.readFileSync(path.join(dir, SYNC_MARKER), "utf-8")) || 0;
    } catch {
        return 0;
    }
};

const markSynced = (dir: string) => fs.writeFileSync(path.join(dir, SYNC_MARKER), String(Date.now()));

/**
 * Makes sure a shallow clone of `source` exists in the global cache and is up to date.
 * When `maxAge` is given, a cache synced less than `maxAge` ms ago is used as-is (no network).
 */
export const syncRepo = async (source: GitSource, { maxAge = 0 } = {}): Promise<SyncResult> => {
    const dir = cacheDirFor(source);

    if (fs.existsSync(path.join(dir, ".git"))) {
        if (maxAge > 0 && Date.now() - lastSync(dir) < maxAge) {
            return { dir, status: "fresh" };
        }
        try {
            await shallowUpdate(dir, source.ref);
            markSynced(dir);
            return { dir, status: "updated" };
        } catch (error) {
            return { dir, status: "stale", error };
        }
    }

    // Clone next to the final location and move it in place only when complete,
    // so an interrupted clone never leaves a broken cache behind.
    await fs.promises.mkdir(GLOBAL_CACHE_PATH, { recursive: true });
    const tmp = `${dir}.tmp-${process.pid}`;
    const keep = removeOnExit(tmp);
    await shallowClone(source.url, tmp, source.ref);
    await fs.promises.rm(dir, { recursive: true, force: true });
    await fs.promises.rename(tmp, dir);
    keep();
    markSynced(dir);

    return { dir, status: "cloned" };
};
