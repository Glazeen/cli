import chalk from "chalk";
import { Command } from "commander";
import gradient from "gradient-string";
import ora, { Ora } from "ora";
import { shouldShow } from "./config";

const glazeenColors = {
    primaryBlue: "#2962FF",
    gradientStart: "#42A5F5",
    gradientEnd: "#1565C0"
};

const glazeenGradient = gradient(
    glazeenColors.gradientStart,
    glazeenColors.gradientEnd
);

export const logger = {
    intro() {
        logger.brand("Glazeen CLI");
        console.log(
            chalk.dim.italic(
                "- A powerful and intuitive CLI for scaffolding modern projects with ease."
            )
        );
        logger.nl();
    },
    verbose(message: string) {
        if (!shouldShow("verbose")) return this;
        console.log(`${chalk.magenta("v")} ${message}`);
        return this;
    },
    info(message: string) {
        console.log(`${chalk.cyan("i")} ${message}`);
        return this;
    },
    warning(message: string) {
        console.log(`${chalk.yellow("!")} ${message}`);
    },
    error(message: string) {
        console.log(`${chalk.red("✖")} ${message}`);
    },
    success(message: string) {
        console.log(`${chalk.green("✔")} ${message}`);
        return this;
    },
    brand(message: string) {
        console.log(
            `🔹 ${chalk.bold.underline(glazeenGradient.multiline(message))}`
        );
        return this;
    },
    logSubprocessOutput(data: string | Buffer) {
        process.stdout.write(data);
    },
    spinner(text: string, frames?: string[]): Ora {
        return ora({
            text,
            spinner: frames
                ? undefined
                : {
                      frames: ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️"],
                      interval: 80
                  }
        });
    },
    nl() {
        console.log("");
        return this;
    }
};
