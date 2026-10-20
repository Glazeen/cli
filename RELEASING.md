# Release Workflow

This document outlines the release process for the `@glazeen/cli` package, which is managed using [Changesets](https://github.com/changesets/changesets).

## Philosophy

We use Changesets to manage versioning and changelogs. This approach allows contributors to declare the impact of their changes (patch, minor, or major) as they make them. When it's time for a release, Changesets consolidates all these declared intents into a new version and updates the changelog automatically.

## Manual Release Process

The release process involves three main steps: adding changesets, versioning the package, and publishing.

### 1. Adding a Changeset

When you've made a code change that should be included in the next release, you need to add a changeset. This is done from your development branch.

Run the following command:

```bash
pnpm changeset
```

This will launch an interactive CLI that will ask you:

1.  Which packages to include in the changeset (in our case, just `@glazeen/cli`).
2.  The semver bump type for each package (major, minor, or patch).
3.  A summary of the change.

This will generate a new markdown file in the `.changeset` directory. This file should be committed along with your code changes.

**Example:**

```markdown
---
"@glazeen/cli": patch
---

Fix a bug in the create command.
```

### 2. Versioning

When it's time to prepare a new release, you'll run the `version` command. This command consumes all the changeset files, updates the package versions in `package.json`, and updates the `CHANGELOG.md` file.

```bash
pnpm run version
```

(Use `pnpm run version`, not `pnpm version`. The latter may run pnpm's built-in version command instead of the script.)

This command will:

1.  Find all changeset files in the `.changeset` directory.
2.  Apply the version bumps to `package.json`.
3.  Generate/update the `CHANGELOG.md` file.
4.  Delete the consumed changeset files.

The changes made by this command should be committed to a new branch (e.g., `release`) and a pull request should be opened to merge them into `main`.

### 3. Publishing

Once the release pull request is merged into `main`, you can publish the new version to the npm registry.

The `release` script in `package.json` handles building and publishing:

```bash
pnpm release
```

This script runs `pnpm typecheck` and `pnpm build`, then `changeset publish`. `changeset publish` publishes the package to npm and creates a new Git tag for the release. Push the tag afterwards with `git push --follow-tags`.

## The `glazeen` and `create-glazeen` packages

`packages/glazeen` (`npx glazeen …`) and `packages/create-glazeen` (`npm create glazeen@latest`) are tiny wrappers: their `index.js` imports `@glazeen/cli`, which runs the CLI. They are released together with `@glazeen/cli`, with the same version, and depend on exactly that version. You never edit their versions by hand:

- `pnpm run version` runs `scripts/wrappers.mjs sync` after `changeset version`, which copies the new version into both packages.
- `pnpm release` runs `scripts/wrappers.mjs publish` after `changeset publish`, which publishes the wrappers whose version isn't on npm yet. It's safe to run again if a publish fails halfway.

Changesets only need to mention `@glazeen/cli`.

## How the package is built

| Script           | What it does                                                                |
| ---------------- | --------------------------------------------------------------------------- |
| `pnpm dev`       | Runs the CLI from source with `tsx` (e.g. `pnpm dev create my-app`)          |
| `pnpm typecheck` | Type-checks with `tsc` (no output files)                                     |
| `pnpm build`     | Bundles the CLI with esbuild (`scripts/build.mjs`) into `dist/index.js`      |

The build bundles the CLI **and all of its dependencies** into the single file `dist/index.js`. It also writes their licenses to `dist/THIRD-PARTY-LICENSES.txt`. As a result, the published package has no runtime dependencies, and `npx @glazeen/cli` installs and starts quickly.

Because of that:

- **Add every package to `devDependencies`** (`pnpm add -D <pkg>`), including the ones used at runtime. They are bundled at build time.
- Before publishing, check the package contents with `pnpm pack` and test the result with `npx ./glazeen-cli-<version>.tgz create test-app`.
- `prepublishOnly` runs the type check and build automatically, so a manual `npm publish` can't publish a stale `dist/`.
