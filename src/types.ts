import { z } from "zod";

const CommandsSchema = z.union([z.string(), z.array(z.string())]);

export const ConfirmChoicesSchema = z.object({
    Yes: CommandsSchema.optional(),
    No: CommandsSchema.optional(),
});

/** e.g. `[{ "pnpm": "pnpm install" }, { "npm": ["npm install"] }]` — label → command(s) */
export const PromptChoicesSchema = z.record(z.string(), CommandsSchema).array();

/** A file or folder of the template, relative to the template folder (e.g. `prisma` or `src/db.ts`) */
const TemplatePathSchema = z
    .string()
    .transform((value) => value.replace(/\\/g, "/").replace(/^(\.\/)+/, "").replace(/\/+$/, ""))
    .refine(
        (value) => value && !value.startsWith("/") && !/^[A-Za-z]:/.test(value) && !value.split("/").includes(".."),
        { error: 'Must be a path inside the template folder, e.g. "prisma" or "src/db.ts"' }
    );
const TemplatePathsSchema = z.union([TemplatePathSchema, TemplatePathSchema.array()]);

/** Files only created for some answers, e.g. `{ "Yes": ["prisma", "prisma.config.ts"] }` — answer → path(s) */
export const ConfirmFilesSchema = z.strictObject({
    Yes: TemplatePathsSchema.optional(),
    No: TemplatePathsSchema.optional(),
});
export const ChoiceFilesSchema = z.record(z.string(), TemplatePathsSchema);

export const BasePromptSchema = z.object({
    key: z
        .string()
        .regex(/^[A-Za-z_][\w-]*$/, "Key must start with a letter or _ and contain only letters, digits, _ or -")
        .optional(),
    message: z.string({ error: "Message for prompt is required" }),
    default: z.string().optional(),
    response_message: z.string().optional(),
});

export const TextPromptSchema = BasePromptSchema.extend({
    type: z.literal("text"),
    choices: z.never().optional(),
    files: z.never({ error: "Text prompts can't have files, use a confirm or select prompt" }).optional(),
});

export const ConfirmablePromptSchema = BasePromptSchema.extend({
    type: z.literal("confirm"),
    choices: ConfirmChoicesSchema.optional(),
    files: ConfirmFilesSchema.optional(),
});

export const SelectablePromptSchema = BasePromptSchema.extend({
    type: z.enum(["select", "multiselect"]),
    choices: PromptChoicesSchema,
    files: ChoiceFilesSchema.optional(),
});

export const PromptSchema = z.discriminatedUnion(
    "type",
    [TextPromptSchema, ConfirmablePromptSchema, SelectablePromptSchema],
    { error: "Type of prompt is required (text, confirm, select or multiselect)" }
);

export const PostCreateCommandSchema = z.object({
    command: z.string(),
    response_message: z.string().optional(),
});

export const GlazeenConfigSchema = z
    .object({
        name: z.string(),
        description: z.string().optional().default(""),
        prompts: z.array(PromptSchema).optional().default([]),
        post_create: z.array(PostCreateCommandSchema).optional().default([]),
        next_steps: z.array(z.string()).optional().default([]),
    })
    .superRefine((config, ctx) => {
        // The answers in `files` must be choices of the same select prompt
        config.prompts.forEach((prompt, index) => {
            if (prompt.type !== "select" && prompt.type !== "multiselect") return;
            const labels = new Set(prompt.choices.flatMap((choice) => Object.keys(choice)));
            for (const answer of Object.keys(prompt.files ?? {})) {
                if (labels.has(answer)) continue;
                ctx.addIssue({
                    code: "custom",
                    path: ["prompts", index, "files", answer],
                    message: `"${answer}" is not one of the choices (${[...labels].join(", ")})`,
                });
            }
        });
    });

export type GlazeenConfig = z.infer<typeof GlazeenConfigSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type PostCreateCommand = z.infer<typeof PostCreateCommandSchema>;
export type TemplateVariables = Record<string, string | string[]>;

export interface Template {
    /** Absolute path to the template folder (the one containing glazeen.config.json) */
    path: string;
    config: GlazeenConfig;
}
