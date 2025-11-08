import { log, spinner } from "@clack/prompts";

export const COMMAND_POOL: { command: string; response_message?: string }[] =
    [];

export const runPostCreateActions = async (cwd: string) => {
    const s = spinner();
    s.start("Starting...");

    const [{ execa }, { default: logUpdate }] = await Promise.all([
        import("execa"),
        import("log-update")
    ]);

    for (const cmd of COMMAND_POOL) {
        s.message(`> ${cmd.command} - ${cmd.response_message || "Running"}`);

        const child = execa({ cwd, all: true })`${cmd.command}`;

        const window: string[] = [];
        const MAX_LINES = 10;

        child.all?.on("data", (chunk) => {
            const text = chunk.toString();
            for (const line of text.split(/\r?\n/)) {
                if (!line) continue;
                window.push(line);
                if (window.length > MAX_LINES) window.shift();
            }
            logUpdate(window.join("\n"));
        });

        await child;
        logUpdate.done();

        if (cmd.response_message) {
            log.info(cmd.response_message);
        }
    }

    s.stop("Post create actions completed.");
};
