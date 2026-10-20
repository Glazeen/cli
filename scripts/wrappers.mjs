// `create-glazeen` and `glazeen` (in packages/) only run @glazeen/cli, so they are released
// with the same version and depend on exactly that version.
//   node scripts/wrappers.mjs sync     sets their version (run by `pnpm run version`)
//   node scripts/wrappers.mjs publish  publishes the versions not on npm yet (run by `pnpm release`)
import { execSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const { name: cliName, version } = JSON.parse(readFileSync("package.json", "utf-8"));
const dirs = readdirSync("packages").map((name) => path.join("packages", name));

const isPublished = (name) => {
    try {
        return execSync(`npm view ${name}@${version} version`, { stdio: "pipe" }).toString().trim() === version;
    } catch {
        return false;
    }
};

const command = process.argv[2];
for (const dir of dirs) {
    const file = path.join(dir, "package.json");
    const pkg = JSON.parse(readFileSync(file, "utf-8"));

    if (command === "sync") {
        pkg.version = version;
        pkg.dependencies[cliName] = version;
        writeFileSync(file, `${JSON.stringify(pkg, null, 4)}\n`);
        console.log(`${pkg.name} → ${version}`);
    } else if (command === "publish") {
        if (pkg.version !== version || pkg.dependencies[cliName] !== version) {
            throw new Error(`${pkg.name} is not at ${version}. Run "node scripts/wrappers.mjs sync" first.`);
        }
        if (isPublished(pkg.name)) {
            console.log(`${pkg.name}@${version} is already published`);
            continue;
        }
        execSync("npm publish", { cwd: dir, stdio: "inherit" });
    } else {
        throw new Error("Usage: node scripts/wrappers.mjs <sync|publish>");
    }
}
