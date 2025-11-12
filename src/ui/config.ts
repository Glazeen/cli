// Simple implementation without external dependencies for now
export interface OutputConfig {
    verbosity: "minimal" | "normal" | "verbose" | "debug";
    terminalWidth: number;
}

export const defaultConfig: OutputConfig = {
    verbosity: "normal",
    terminalWidth: process.stdout.columns || 80
};

export let currentConfig: OutputConfig = { ...defaultConfig };

export function configureOutput(config: Partial<OutputConfig>) {
    currentConfig = { ...currentConfig, ...config };
}

export function getOutputLevel() {
    const levels = {
        minimal: 0,
        normal: 1,
        verbose: 2,
        debug: 3
    };
    return levels[currentConfig.verbosity];
}

export function shouldShow(level: (typeof defaultConfig)["verbosity"]) {
    return (
        getOutputLevel() >=
        {
            minimal: 0,
            normal: 1,
            verbose: 2,
            debug: 3
        }[level]
    );
}
