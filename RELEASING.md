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

```plaintext
## "@glazeen/cli": patch
Fix a bug in the create command.
```

### 2. Versioning

When it's time to prepare a new release, you'll run the `version` command. This command consumes all the changeset files, updates the package versions in `package.json`, and updates the `CHANGELOG.md` file.

```bash
pnpm version
```

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

This script runs `pnpm build` and then `changeset publish`. `changeset publish` will publish the package to npm and create a new Git tag for the release.
