import fs from "fs-extra";
import path from "path";
import Handlebars from "handlebars";
import { logger } from "../ui";

const CONFIG_FILE = "glazeen.config.json";

export async function scaffold(
    templateDir: string,
    targetDir: string,
    variables: Record<string, any>
): Promise<void> {
    Handlebars.registerHelper("eq", function (a: unknown, b: unknown, options: any) {
        if (a === undefined) {
            const argName = (options.ids && options.ids[0]) || "unknown";
            throw new Error(`Variable "${argName}" is missing. Did you forget to add it to your prompts?`);
        }
        if (b === undefined) {
            const argName = (options.ids && options.ids[1]) || "unknown";
            throw new Error(`Variable "${argName}" is missing. Did you forget to add it to your prompts?`);
        }
        return a === b;
    });

    Handlebars.registerHelper("neq", function (a: unknown, b: unknown, options: any) {
        if (a === undefined) {
            const argName = (options.ids && options.ids[0]) || "unknown";
            throw new Error(`Variable "${argName}" is missing. Did you forget to add it to your prompts?`);
        }
        if (b === undefined) {
            const argName = (options.ids && options.ids[1]) || "unknown";
            throw new Error(`Variable "${argName}" is missing. Did you forget to add it to your prompts?`);
        }
        return a !== b;
    });

    await fs.ensureDir(targetDir);

    const items = await fs.readdir(templateDir, { withFileTypes: true });

    for (const item of items) {
        const sourcePath = path.join(templateDir, item.name);
        let targetPath = path.join(targetDir, item.name);

        if (item.name === CONFIG_FILE) {
            continue; // Skip config file
        }

        if (item.isDirectory()) {
            await scaffold(sourcePath, targetPath, variables); // Recursive call
        } else {
            if (item.name.endsWith(".hbs")) {
                try {
                    targetPath = targetPath.slice(0, -4); // Remove .hbs extension
                    const templateContent = await fs.readFile(sourcePath, "utf-8");
                    const template = Handlebars.compile(templateContent, { strict: true, trackIds: true } as any);
                    const rendered = template(variables);
                    await fs.writeFile(targetPath, rendered);
                } catch (error) {
                    const chalk = (await import("chalk")).default;
                    console.log(chalk.gray('│'))
                    logger.error(` Error processing template file: ${chalk.yellow(path.basename(sourcePath))}\n${chalk.gray('└')}    ${chalk.gray((error as Error).message)}`);
                    throw error; // Propagate error to stop scaffolding
                }
            } else {
                await fs.copy(sourcePath, targetPath);
            }
        }
    }
}
