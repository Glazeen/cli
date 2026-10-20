---
"@glazeen/cli": minor
---

New look, faster startup and support for your own template repositories.

**Interface**

- A new Glazeen banner with the polar bear and the brand colors when you run `create`. It's shown only in interactive terminals with color support, and a compact version is used on narrow terminals.
- Every command now uses the same step-by-step layout: an intro, one line per step (fetching templates, questions, creating files, each setup command), a "Next steps" box and a final summary.
- Setup commands (e.g. `pnpm install`) show their live output while running. If one fails, its output stays visible, the remaining commands are listed under "Next steps" and the CLI exits with code 1.
- Clearer error messages, including the exact field when a `glazeen.config.json` is invalid. Add `--verbose` to see details.
- Ctrl+C cancels cleanly at any point and removes a half-created project folder.
- Asks for confirmation before writing into a folder that isn't empty.

**Performance**

- Templates are cached and checked for updates at most once per hour, instead of on every run. Use `--refresh` to check now. If the update fails (e.g. offline), the cached copy is used.
- Repositories are cloned shallowly (`--depth 1`).
- The CLI is bundled into a single file with no runtime dependencies, so `npx` installs much less and `--version`/`--help` run in about 70 ms (about 1.5 s before).

**Your own templates**

- `create -t` accepts a GitHub repository (`owner/repo`, `owner/repo/subfolder`, `owner/repo#branch`), a GitHub URL (including `/tree/<branch>/<folder>` links), any git URL or a local folder.
- `list [source]` lists the templates in any source and reports invalid configs.
- The template picker has an "Other source…" option.
- A repository can contain one template or several, one per subfolder.
- Set `GLAZEEN_TEMPLATES_REPO` to replace the official templates with your own catalog.
- New prompt types: `select` and `multiselect`.
- Optional files: a prompt's `files` lists the files and folders to create only for some answers, e.g. `"files": { "Yes": ["prisma", "prisma.config.ts"] }`. `list` reports listed paths that don't exist.
- New template helpers: `includes` (for multiselect answers), `and`, `or`, `not` and `json`.
- Commands triggered by prompts now use the prompt's `response_message`.
- The README has a full guide to writing templates.

**Template fixes**

- Answers are no longer HTML-escaped: `Tom's app` was written as `Tom&#x27;s app`.
- A misspelled variable inside `{{#if}}`, `{{#unless}}`, `{{#each}}` or `{{#with}}` is now reported as an error instead of silently rendering the wrong branch. Missing-variable errors include the line number.
- `.hbs` files keep their permissions (e.g. the executable bit).
- Prompt keys are validated (letters, digits, `_` and `-`).

**Breaking:** requires Node.js 20.12 or newer.
