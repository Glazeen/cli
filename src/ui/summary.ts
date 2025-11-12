import boxen, { Options } from "boxen";
import { hrtime } from "node:process";
import { EOL } from "os";
import { currentConfig } from "./config.js";
import { logger } from "./logger.js";
import chalk from "chalk";

const defaultBoxenOptions: Options = {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    titleAlignment: "center"
};

export function showFinalSummary({
    commands,
    executionTime,
    projectName
}: {
    commands?: {
        name: string;
        startTime: [number, number];
    }[];
    executionTime?: [number, number];
    projectName: string;
}) {
    const { nextSteps } = currentConfig;
    const executionTimeInSeconds = executionTime
        ? hrtime(executionTime)[0]
        : undefined;

    const summaryLines = [
        `🎉 Project ${chalk.bold(projectName)} created! 🎉`,
        "",
        "Executed commands:",
        ...(commands ?? []).map(
            (command, index) =>
                `${index + 1}. ${chalk.bold(command.name)} (${hrtime(
                    command.startTime
                )}s)`
        ),
        "",
        `Total execution time: ${executionTimeInSeconds}s`,
        "",
        ...(nextSteps
            ? [
                  "Next steps:",
                  ...nextSteps.map((step, index) => `${index + 1}. ${step}`)
              ]
            : [])
    ];

    logger.log(
        boxen(summaryLines.join("\n"), {
            ...defaultBoxenOptions,
            title: "Final Summary"
        })
    );
}
