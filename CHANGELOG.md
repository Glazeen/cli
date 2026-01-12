# @glazeen/cli

## 1.4.0

### Minor Changes

- 12a7913: Implement template scaffolding from remote GitHub repo URL for custom glazeen templates
- 74dadb7: Enhance error handling for glazeen.config.json schema
- 762a5e9: Improve error handling and messages for undefined handlebars prompt variables

## 1.3.0

### Minor Changes

- 20df20e: Add boxen summary at the end of project creation
- ce472a5: rework prompter module
- ce472a5: Rework logger architecture, improve spinner tasks output logging

### Patch Changes

- ce472a5: Remove post create commands to execute debug log

## 1.2.0

### Minor Changes

- Fix a bug where caching was not used correctly, again

## 1.1.0

### Minor Changes

- Fix a bug where the cache was not initializing properly

## 1.0.1

### Patch Changes

- 21c884d: add list comand
- 7853853: Implement commands execution on post create
- dee5711: Add scaffolding-engine for directories copy-paste and templates compilation
- eeb10da: Move to local cache strategy for boilerplates repository and implement part of the create command
