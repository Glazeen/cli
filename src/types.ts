interface BasePrompt {
    key?: string;
    message: string;
    default: string;
    response_message?: string;
}

type ConfirmChoices = {
    Yes?: string | string[];
    No?: string | string[];
};

type PromptChoices = {
    [key: string]: string | string[];
}[];

interface TextPrompt extends BasePrompt {
    type: "text";
    choices?: never;
}

interface ConfirmablePrompt extends BasePrompt {
    type: "confirm";
    choices?: ConfirmChoices;
}

interface SelectablePrompt extends BasePrompt {
    type: "select" | "multiselect";
    choices?: PromptChoices;
}

type Prompt = TextPrompt | ConfirmablePrompt | SelectablePrompt;

interface GlazeenConfig {
    name: string;
    description: string;
    prompts: Prompt[];
    post_create: {
        command: string;
        response_message: string;
    }[];
    next_steps?: string[];
}
