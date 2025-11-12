import { log, select, text, confirm } from "@clack/prompts";

export const prompter = async (prompt: Prompt) => {
    const type = prompt.type;
    let response;

    const variables: Record<string, string> = {};
    const commands: string[] = [];

    switch (type) {
        case "text":
            response = await text({
                message: prompt.message,
                defaultValue: prompt.default,
                placeholder: prompt.default
            });

            variables[prompt.key!] = response as string;

            break;

        case "confirm":
            response = await confirm({
                message: prompt.message
            });

            if (response) {
                if (prompt.choices?.Yes && prompt.choices?.Yes?.length > 0) {
                    typeof prompt.choices?.Yes === "string"
                        ? commands.push(prompt.choices.Yes)
                        : commands.push(...(prompt.choices?.Yes || []));
                }

                variables[prompt.key!] = "Yes";
            } else {
                if (prompt.choices?.No && prompt.choices?.No?.length > 0) {
                    typeof prompt.choices?.No === "string"
                        ? commands.push(prompt.choices.No)
                        : commands.push(...(prompt.choices?.No || []));
                }
                variables[prompt.key!] = "No";
            }

            break;
    }

    return {
        response: response as string,
        variables,
        commands
    };
};
