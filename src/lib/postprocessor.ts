import * as p from "@clack/prompts";
import { spawn } from "child_process";
import pc from "picocolors";
import { PostCreateCommand } from "../types";
import { formatDuration } from "../ui";
import { accent } from "../ui/brand";

export interface CommandResult {
    command: string;
    duration: number;
    exitCode: number;
}

/** Runs a shell command, streaming its output line by line to `onLine`. Resolves with the exit code. */
const run = (command: string, cwd: string, onLine: (line: string) => void) =>
    new Promise<number>((resolve) => {
        const child = spawn(command, { cwd, shell: true, stdio: ["ignore", "pipe", "pipe"] });

        const forward = (stream: NodeJS.ReadableStream) => {
            let pending = "";
            stream.setEncoding("utf-8");
            stream.on("data", (chunk: string) => {
                const lines = (pending + chunk).split(/\r?\n/);
                pending = lines.pop() ?? "";
                // Progress bars rewrite the line with \r: keep only the latest state
                for (const line of lines) {
                    const visible = line.slice(line.lastIndexOf("\r") + 1).trimEnd();
                    if (visible) onLine(visible);
                }
            });
            stream.on("end", () => pending.trim() && onLine(pending.trimEnd()));
        };
        forward(child.stdout);
        forward(child.stderr);

        child.on("error", (error) => {
            onLine(error.message);
            resolve(1);
        });
        child.on("close", (code) => resolve(code ?? 1));
    });

/**
 * Runs the post create commands one after another inside the new project.
 * Output is streamed in a live window that collapses on success and stays visible on failure.
 * Stops at the first failing command.
 */
export const runPostCreateActions = async (commands: PostCreateCommand[], cwd: string) => {
    const results: CommandResult[] = [];

    for (const { command, response_message } of commands) {
        const log = p.taskLog({
            title: `${response_message || "Running"} ${pc.dim(`$ ${command}`)}`,
            limit: 10,
            retainLog: true,
        });

        const startedAt = performance.now();
        const exitCode = await run(command, cwd, (line) => log.message(line));
        const duration = performance.now() - startedAt;
        results.push({ command, duration, exitCode });

        if (exitCode !== 0) {
            log.error(`${accent(command)} failed with exit code ${exitCode}`, { showLog: true });
            break;
        }
        log.success(`${accent(command)} ${pc.dim(formatDuration(duration))}`);
    }

    return results;
};
