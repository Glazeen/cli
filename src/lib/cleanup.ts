import fs from "fs";

const tasks = new Set<() => void>();

// `exit` handlers must be synchronous, so cleanup uses the sync fs API.
process.on("exit", () => {
    for (const task of tasks) {
        try {
            task();
        } catch {
            // best effort
        }
    }
});

// A SIGINT listener (clack's spinner registers one) disables Node's default
// termination, so exit explicitly to make sure the cleanup above runs.
process.on("SIGINT", () => process.exit(130));
process.on("SIGTERM", () => process.exit(143));

/** Removes `dir` when the process exits, unless the returned function is called first. */
export const removeOnExit = (dir: string) => {
    const task = () => fs.rmSync(dir, { recursive: true, force: true });
    tasks.add(task);
    return () => {
        tasks.delete(task);
    };
};
