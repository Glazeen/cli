import { z } from "zod";

export const ConfirmChoicesSchema = z.object({
    Yes: z.union([z.string(), z.array(z.string())]).optional(),
    No: z.union([z.string(), z.array(z.string())]).optional(),
});

export const PromptChoicesSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())])).array();

export const BasePromptSchema = z.object({
    key: z.string().optional(),
    message: z.string({error: 'Message for prompt is required'}),
    default: z.string().optional(),
    response_message: z.string().optional(),
});

export const TextPromptSchema = BasePromptSchema.extend({
    type: z.literal("text"),
    choices: z.never().optional(),
});

export const ConfirmablePromptSchema = BasePromptSchema.extend({
    type: z.literal("confirm"),
    choices: ConfirmChoicesSchema.optional(),
});

export const SelectablePromptSchema = BasePromptSchema.extend({
    type: z.enum(["select", "multiselect"]),
    choices: PromptChoicesSchema.optional(),
});

export const PromptSchema = z.discriminatedUnion("type", [
    TextPromptSchema,
    ConfirmablePromptSchema,
    SelectablePromptSchema,
], {error: 'Type of prompt is required'});

export const GlazeenConfigSchema = z.object({
    name: z.string(),
    description: z.string(),
    prompts: z.array(PromptSchema),
    post_create: z.array(
        z.object({
            command: z.string(),
            response_message: z.string(),
        })
    ),
    next_steps: z.array(z.string()).optional(),
});

export type GlazeenConfig = z.infer<typeof GlazeenConfigSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type ConfirmChoices = z.infer<typeof ConfirmChoicesSchema>;
export type PromptChoices = z.infer<typeof PromptChoicesSchema>;
export type TextPrompt = z.infer<typeof TextPromptSchema>;
export type ConfirmablePrompt = z.infer<typeof ConfirmablePromptSchema>;
export type SelectablePrompt = z.infer<typeof SelectablePromptSchema>;
