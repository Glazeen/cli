import * as p from "@clack/prompts";
import os from "os";
import path from "path";
import pc from "picocolors";
import { badge } from "./brand";

let verbose = false;

export const setVerbose = (value: boolean) => {
    verbose = value;
};

export const intro = (version: string) => {
    p.intro(`${badge(" glazeen ")} ${pc.dim(`v${version}`)}`);
};

/** Only printed with --verbose */
export const debug = (message: string) => {
    if (verbose) p.log.message(pc.dim(message), { symbol: pc.magenta("◦") });
};

/** Logs an error (with optional dim detail lines), closes the frame and exits with code 1. */
export const fail = (message: string, details?: string | string[]): never => {
    const lines = typeof details === "string" ? details.split(/\r?\n/) : details ?? [];
    const detail = lines
        .map((line) => line.trimEnd())
        .filter(Boolean)
        .map((line) => pc.dim(line))
        .join("\n");

    p.log.error(detail ? `${message}\n${detail}` : message);
    p.outro(pc.red("Failed"));
    process.exit(1);
};

/** Unwraps a prompt result, exiting gracefully when the user cancels (Ctrl+C / Esc). */
export const ensure = <T>(value: T): Exclude<T, symbol> => {
    if (p.isCancel(value)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
    }
    return value as Exclude<T, symbol>;
};

/** Replaces the cwd with `.` and the home directory with `~` */
export const shortenPath = (target: string) => {
    const cwd = process.cwd();
    if (target === cwd) return ".";
    if (target.startsWith(cwd + path.sep)) return `.${path.sep}${path.relative(cwd, target)}`;
    const home = os.homedir();
    if (target.startsWith(home + path.sep)) return `~${path.sep}${path.relative(home, target)}`;
    return target;
};

export const formatDuration = (ms: number) =>
    ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
