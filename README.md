<div align="center">
  <br />
  <h1>Glazeen CLI</h1>
  <p>A powerful and intuitive CLI for scaffolding modern projects with ease.</p>
  <br />
    <p>
    <!-- <a href="https://www.npmjs.com/package/@glazeen/cli"><img src="https://img.shields.io/npm/v/@glazeen/cli?style=for-the-badge&logo=npm&color=CB3837" alt="NPM Version"></a>
    <a href="https://github.com/glazeen/cli/blob/master/LICENSE"><img src="https://img.shields.io/github/license/glazeen/cli?style=for-the-badge&color=blue" alt="License"></a>
    <a href="https://github.com/glazeen/cli/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/glazeen/cli/ci.yml?branch=master&style=for-the-badge&logo=github" alt="Build Status"></a> -->
  </p>
</div>

---

## About The Project

The Glazeen CLI is a command-line tool designed to standardize and automate the process of creating new projects. It provides an interactive and user-friendly interface to help developers scaffold new applications from a curated list of templates, ensuring consistency and best practices across your team.

Say goodbye to manual boilerplate setup and hello to rapid, error-free project initialization!

## Installation

You can use the Glazeen CLI directly with `npx` without needing a global installation, which is the recommended approach.

```bash
npx @glazeen/cli <command>
```

Alternatively, you can install it globally using your favorite package manager:

```bash
# With pnpm
pnpm add -g @glazeen/cli

# With npm
npm install -g @glazeen/cli

# With yarn
yarn global add @glazeen/cli
```

## Usage

The Glazeen CLI is simple and intuitive to use. The primary command is `create`, which launches an interactive wizard to guide you through the project setup process.

### Creating a New Project

To start a new project, run the `create` command followed by your desired project name:

```bash
npx @glazeen/cli create my-awesome-project
```

This will trigger a series of prompts to help you select a template and configure your new project.

### Listing Available Templates

To see a list of all the available project templates, use the `list` command:

```bash
npx @glazeen/cli list
```

This will display a clean, easy-to-read list of all the official Glazeen templates you can use for your projects.

## Available Commands

Here's a quick overview of the available commands:

| Command                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `create <project-name>` | Creates a new project with an interactive wizard.   |
| `list`                  | Lists all available project templates.              |
| `help`                  | Displays the help menu with all available commands. |

---

<div align="center">
  <p>Made with ❤️ by the <b>🐻‍❄️Glazeen</b> Team</p>
</div>
