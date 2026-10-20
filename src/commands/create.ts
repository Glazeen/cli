import * as p from "@clack/prompts";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import pc from "picocolors";
import { defaultCatalog, loadTemplates } from "../lib/catalog";
import { removeOnExit } from "../lib/cleanup";
import { runPostCreateActions } from "../lib/postprocessor";
import { scaffold, TemplateRenderError } from "../lib/scaffolding-engine";
import { parseSource } from "../lib/source";
import { findTemplate } from "../lib/templates";
import { PostCreateCommand, Template, TemplateVariables } from "../types";
import { ensure, fail, formatDuration, shortenPath } from "../ui";
import { accent } from "../ui/brand";
import { prompter } from "../ui/prompter";

interface CreateOptions {
    template?: string;
    refresh?: boolean;
}

const OTHER_SOURCE = "other-source";

const pickTemplate = async (templates: Template[], message = "Which template would you like to use?") => {
    if (templates.length === 1) return templates[0];
    return ensure(
        await p.select({
            message,
            options: templates.map((template) => ({
                value: template,
                label: template.config.name,
                hint: template.config.description,
            })),
        })
    );
};

const askProjectName = async () =>
    ensure(
        await p.text({
            message: "What is the name of your project?",
            placeholder: "my-app",
            validate: (value) => (value?.trim() ? undefined : "Please enter a project name."),
        })
    ).trim();

/** Asks before writing into a folder that already has content */
const checkTargetDir = async (targetDir: string) => {
    const isNonEmpty = fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0;
    if (!isNonEmpty) return;

    const overwrite = ensure(
        await p.confirm({
            message: `${accent(shortenPath(targetDir))} is not empty. Continue and overwrite existing files?`,
            initialValue: false,
        })
    );
    if (!overwrite) {
        p.cancel("Operation cancelled.");
        process.exit(0);
    }
};

const resolveTemplate = async ({ template: input, refresh }: CreateOptions): Promise<Template> => {
    // -t <source>: a GitHub repo, git URL or local folder
    const source = input ? parseSource(input) : null;
    if (source) {
        return pickTemplate(await loadTemplates(source));
    }

    const templates = await loadTemplates(defaultCatalog(), { isDefault: true, refresh });

    // -t <name>: a template from the default catalog
    if (input) {
        const template = findTemplate(templates, input);
        if (!template) {
            fail(
                `Template ${accent(input)} not found.`,
                `Available templates: ${templates.map((t) => t.config.name).join(", ")}`
            );
        }
        return template!;
    }

    const choice = ensure(
        await p.select<Template | typeof OTHER_SOURCE>({
            message: "Which template would you like to use?",
            options: [
                ...templates.map((template) => ({
                    value: template,
                    label: template.config.name,
                    hint: template.config.description,
                })),
                {
                    value: OTHER_SOURCE,
                    label: "Other source…",
                    hint: "a GitHub repository, git URL or local folder",
                },
            ],
        })
    );
    if (choice !== OTHER_SOURCE) return choice;

    const sourceInput = ensure(
        await p.text({
            message: "Where is the template?",
            placeholder: "owner/repo, https://github.com/owner/repo or ./path/to/template",
            validate: (value) =>
                parseSource(value ?? "") ? undefined : "Enter a GitHub repository, a git URL or a local path.",
        })
    );
    return pickTemplate(await loadTemplates(parseSource(sourceInput)!));
};

const handler = async (projectArg: string | undefined, options: CreateOptions) => {
    const startedAt = performance.now();

    const projectName = projectArg?.trim() || (await askProjectName());
    const targetDir = path.resolve(projectName);
    await checkTargetDir(targetDir);

    const template = await resolveTemplate(options);
    const { config } = template;

    const variables: TemplateVariables = {};
    const promptCommands: PostCreateCommand[] = [];
    const skippedFiles = new Set<string>();
    for (const prompt of config.prompts) {
        const result = await prompter(prompt);
        Object.assign(variables, result.variables);
        promptCommands.push(...result.commands);
        result.skippedFiles.forEach((file) => skippedFiles.add(file));
    }

    // Remove a half-created project if anything fails before the files are in place
    const keepTarget = fs.existsSync(targetDir) ? () => {} : removeOnExit(targetDir);

    const spinner = p.spinner();
    spinner.start("Creating project files");
    let fileCount: number;
    try {
        fileCount = await scaffold(template.path, targetDir, variables, skippedFiles);
    } catch (error) {
        spinner.error("Could not create the project files");
        if (error instanceof TemplateRenderError) {
            return fail(`Error in template file ${pc.yellow(error.file)}`, error.reason.message);
        }
        return fail((error as Error).message);
    }
    keepTarget();
    spinner.stop(`Created ${fileCount} files in ${accent(shortenPath(targetDir))}`);

    const commands = [...config.post_create, ...promptCommands];
    const results = await runPostCreateActions(commands, targetDir);
    const failed = results.find((result) => result.exitCode !== 0);

    const relativeDir = path.relative(process.cwd(), targetDir);
    const nextSteps = [
        ...(relativeDir ? [`cd ${/\s/.test(relativeDir) ? `"${relativeDir}"` : relativeDir}`] : []),
        // Commands that did not complete must be run by hand
        ...(failed ? commands.slice(results.length - 1).map((c) => c.command) : []),
        ...config.next_steps,
    ];
    if (nextSteps.length) {
        p.note(nextSteps.map((step, i) => `${pc.dim(`${i + 1}.`)} ${step}`).join("\n"), "Next steps");
    }

    const elapsed = pc.dim(`in ${formatDuration(performance.now() - startedAt)}`);
    if (failed) {
        p.outro(pc.yellow("Project created, but a setup command failed. Run the remaining steps manually."));
        process.exitCode = 1;
        return;
    }
    p.outro(`${pc.green("Done!")} ${pc.bold(path.basename(targetDir))} is ready ${elapsed}`);
};

export function register(program: Command) {
    program
        .command("create")
        .description("Create a new project from a template")
        .argument("[project-name]", "name of the folder to create the project in")
        .option(
            "-t, --template <template>",
            "template name, GitHub repository (owner/repo), git URL or local path"
        )
        .option("--refresh", "check for template updates even if the cache is recent")
        .action(handler);
}
