#!/usr/bin/env node
// `npm create glazeen@latest [project-name]` runs `@glazeen/cli create [project-name]`
process.argv.splice(2, 0, "create");
await import("@glazeen/cli");
