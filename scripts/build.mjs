// Bundles the CLI and all of its dependencies into a single ESM file.
// A self-contained bundle means `npx @glazeen/cli` has nothing to install
// besides the package itself, and Node only has to load one file at startup.
import { build } from "esbuild";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";

rmSync("dist", { recursive: true, force: true });

const { metafile } = await build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/index.js",
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    minifySyntax: true,
    minifyWhitespace: true,
    legalComments: "none",
    metafile: true,
    // Some bundled CommonJS dependencies call require() on Node built-ins
    banner: {
        js: 'import { createRequire as __createRequire } from "module"; const require = __createRequire(import.meta.url);',
    },
    logLevel: "info",
});

// The bundle contains third-party code, so ship their licenses along with it
const packageDirs = new Set(
    Object.keys(metafile.inputs)
        .map((input) => input.match(/^(.*node_modules[\\/](?:@[^\\/]+[\\/])?[^\\/]+)/)?.[1])
        .filter(Boolean)
);
const notices = [...packageDirs]
    .map((dir) => {
        const { name, version, license } = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf-8"));
        const file = readdirSync(dir).find((f) => /^(licen[sc]e|copying)/i.test(f));
        const text = file && existsSync(path.join(dir, file)) ? readFileSync(path.join(dir, file), "utf-8").trim() : license;
        return `${name}@${version}\n${"-".repeat(40)}\n${text}`;
    })
    .sort();
writeFileSync(
    "dist/THIRD-PARTY-LICENSES.txt",
    `This bundle includes the following third-party packages:\n\n${notices.join("\n\n\n")}\n`
);
