import * as p from "@clack/prompts";
import { PostCreateCommand, Prompt, TemplateVariables } from "../types";
import { ensure } from ".";

const toList = (commands: string | string[] | undefined) =>
    (Array.isArray(commands) ? commands : [commands]).filter((c): c is string => !!c?.trim());

/** Asks a template prompt. Returns the template variables it sets and the commands it queues. */
export const prompter = async (prompt: Prompt) => {
    const variables: TemplateVariables = {};
    let commands: string[] = [];
    let value: string | string[];

    switch (prompt.type) {
        case "text":
            value =
                ensure(
                    await p.text({
                        message: prompt.message,
                        placeholder: prompt.default,
                        defaultValue: prompt.default,
                    })
                ) ?? "";
            break;

        case "confirm": {
            const confirmed = ensure(
                await p.confirm({
                    message: prompt.message,
                    initialValue: prompt.default?.toLowerCase() !== "no",
                })
            );
            value = confirmed ? "Yes" : "No";
            commands = toList(confirmed ? prompt.choices?.Yes : prompt.choices?.No);
            break;
        }

        case "select":
        case "multiselect": {
            const choices = new Map(prompt.choices.flatMap((choice) => Object.entries(choice)));
            const options = [...choices.keys()].map((label) => ({ value: label, label }));

            const selected: string[] =
                prompt.type === "select"
                    ? [
                          ensure(
                              await p.select({
                                  message: prompt.message,
                                  options,
                                  initialValue: choices.has(prompt.default ?? "") ? prompt.default : undefined,
                              })
                          ),
                      ]
                    : ensure(
                          await p.multiselect({
                              message: prompt.message,
                              options,
                              required: false,
                              initialValues: prompt.default
                                  ?.split(",")
                                  .map((v) => v.trim())
                                  .filter((v) => choices.has(v)),
                          })
                      );

            value = prompt.type === "select" ? selected[0] : selected;
            commands = selected.flatMap((label) => toList(choices.get(label)));
            break;
        }
    }

    if (prompt.key) variables[prompt.key] = value;

    // Files listed under an answer are only created when that answer is picked
    const answers = new Set(Array.isArray(value) ? value : [value]);
    const files = Object.entries(prompt.files ?? {});
    const kept = new Set(files.flatMap(([answer, paths]) => (answers.has(answer) ? toList(paths) : [])));
    const skippedFiles = files.flatMap(([, paths]) => toList(paths)).filter((file) => !kept.has(file));

    return {
        variables,
        skippedFiles,
        commands: commands.map(
            (command): PostCreateCommand => ({ command, response_message: prompt.response_message })
        ),
    };
};
