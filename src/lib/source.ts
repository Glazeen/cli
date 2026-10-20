import fs from "fs";
import os from "os";
import path from "path";

export const DEFAULT_TEMPLATES_REPO = "https://github.com/Glazeen/.boilerplates";

export type Source =
    | { kind: "local"; dir: string; label: string }
    | { kind: "git"; url: string; ref?: string; subpath?: string; label: string };

const GITHUB_URL =
    /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/#]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+?))?)?\/?$/;
const GITHUB_SHORTHAND = /^(?:github:)?([\w.-]+)\/([\w.-]+)((?:\/[^/]+)*)$/;
const GIT_URL = /^(?:https?|ssh|git|file):\/\/|^[\w.-]+@[\w.-]+:/;
const LOCAL_PATH = /^(?:\.{1,2}(?:[\\/]|$)|~(?:[\\/]|$)|[\\/]|[a-zA-Z]:[\\/])/;

const github = (owner: string, repo: string, ref?: string, subpath?: string): Source => {
    subpath = subpath?.replace(/^\/+|\/+$/g, "") || undefined;
    return {
        kind: "git",
        url: `https://github.com/${owner}/${repo}.git`,
        ref,
        subpath,
        label: `${owner}/${repo}${subpath ? `/${subpath}` : ""}${ref ? `#${ref}` : ""}`,
    };
};

/**
 * Parses a template source. Supported formats:
 *  - local paths:        ./my-template, ../templates, ~/templates, C:\templates
 *  - GitHub shorthand:   owner/repo, owner/repo/sub/folder, owner/repo#branch
 *  - GitHub URLs:        https://github.com/owner/repo, .../tree/<branch>/<sub/folder>
 *  - any git URL:        https://gitlab.com/owner/repo.git, git@host:owner/repo.git (+ optional #branch)
 *
 * Returns `null` when the input does not look like a source (e.g. a plain template name).
 */
export const parseSource = (input: string): Source | null => {
    const value = input.trim();
    if (!value) return null;

    // A bare word (e.g. "express-app") is a template name, never a local folder
    if (LOCAL_PATH.test(value) || (/[\\/]/.test(value) && fs.existsSync(value))) {
        const dir = path.resolve(value.replace(/^~(?=$|[\\/])/, os.homedir()));
        return { kind: "local", dir, label: value };
    }

    const hashIndex = value.lastIndexOf("#");
    const base = hashIndex > 0 ? value.slice(0, hashIndex) : value;
    const ref = hashIndex > 0 ? value.slice(hashIndex + 1) || undefined : undefined;

    const githubUrl = base.match(GITHUB_URL);
    if (githubUrl) {
        const [, owner, repo, treeRef, subpath] = githubUrl;
        return github(owner, repo, ref ?? treeRef, subpath);
    }

    if (GIT_URL.test(base)) {
        return { kind: "git", url: base, ref, label: `${base}${ref ? `#${ref}` : ""}` };
    }

    const shorthand = base.match(GITHUB_SHORTHAND);
    if (shorthand) {
        const [, owner, repo, subpath] = shorthand;
        return github(owner, repo, ref, subpath);
    }

    return null;
};
