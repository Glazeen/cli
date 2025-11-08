import fs from "fs-extra";
import path from "path";
import Handlebars from "handlebars";

const CONFIG_FILE = "glazeen.config.json";

export async function scaffold(
    templateDir: string,
    targetDir: string,
    variables: Record<string, any>
): Promise<void> {
    Handlebars.registerHelper("eq", (a: string, b: string) => {
        return a === b;
    });

    Handlebars.registerHelper("neq", (a: string, b: string) => {
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
                targetPath = targetPath.slice(0, -4); // Remove .hbs extension
                const templateContent = await fs.readFile(sourcePath, "utf-8");
                const template = Handlebars.compile(templateContent);
                const rendered = template(variables);
                await fs.writeFile(targetPath, rendered);
            } else {
                await fs.copy(sourcePath, targetPath);
            }
        }
    }
}
