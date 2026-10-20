import { spawn } from "child_process";

export class GitError extends Error {
    constructor(message: string, readonly output: string) {
        super(message);
    }
}

const git = (args: string[], cwd?: string) =>
    new Promise<string>((resolve, reject) => {
        const child = spawn("git", args, {
            cwd,
            // Never block on a credentials prompt hidden behind a spinner
            env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
            stdio: ["ignore", "pipe", "pipe"],
        });

        let output = "";
        child.stdout.on("data", (chunk) => (output += chunk));
        child.stderr.on("data", (chunk) => (output += chunk));

        child.on("error", (error: NodeJS.ErrnoException) => {
            reject(
                error.code === "ENOENT"
                    ? new GitError("Git is not installed or not available in PATH.", "")
                    : error
            );
        });
        child.on("close", (code) => {
            if (code === 0) resolve(output.trim());
            else reject(new GitError(`git ${args[0]} failed (exit code ${code})`, output.trim()));
        });
    });

/** Shallow clone (single commit), optionally of a specific branch or tag. */
export const shallowClone = (url: string, dir: string, ref?: string) =>
    git(["clone", "--depth", "1", "--single-branch", ...(ref ? ["--branch", ref] : []), url, dir]);

/** Updates an existing (shallow) clone to the latest commit of `ref` (default branch when omitted). */
export const shallowUpdate = async (dir: string, ref?: string) => {
    await git(["fetch", "--depth", "1", "origin", ref ?? "HEAD"], dir);
    await git(["reset", "--hard", "FETCH_HEAD"], dir);
};
