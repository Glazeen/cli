interface BasePrompt {
    key?: string;
    message: string;
    default: unknown;
    response_message?: string;
}

type PromptChoices = {
    [key: string]: string | string[];
}[];

interface TextPrompt extends BasePrompt {
    type: "text";
    choices?: never;
}

interface SelectablePrompt extends BasePrompt {
    type: "confirm" | "select" | "multiselect";
    choices?: PromptChoices;
}

type Prompt = TextPrompt | SelectablePrompt;

interface GlazeenConfig {
    name: string;
    description: string;
    prompts: Prompt[];
    post_create: {
        command: string;
        response_message: string;
    }[];
}
