/**
 * Runtime verification harness for this sandbox, which cannot `npm install`
 * (no registry access — see BUILD_STATUS.md). Bundles the real src/ modules
 * with esbuild (resolving the "@/" tsconfig path alias) and actually
 * executes the core business logic with Node's assert, so we get more
 * confidence than a syntax-only check. This is NOT a replacement for
 * `npm run test` (Vitest) — run that after `npm install` on a machine with
 * registry access; this script exists only to self-check inside the build
 * sandbox.
 */
import esbuild from "/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild/lib/main.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const aliasPlugin = {
  name: "alias-at",
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => {
      const rel = args.path.slice(2);
      const base = path.join(root, "src", rel);
      const candidates = [base + ".ts", base + ".tsx", path.join(base, "index.ts")];
      const found = candidates.find((c) => fs.existsSync(c));
      return { path: found ?? base + ".ts" };
    });
  }
};

const entry = path.join(__dirname, "_verify-entry.ts");

const result = await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  plugins: [aliasPlugin],
  logLevel: "silent"
});

const code = result.outputFiles[0].text;
const modPath = path.join(__dirname, "_verify-bundle.cjs");
fs.writeFileSync(modPath, code);

try {
  require(modPath); // runs the assertions as a side effect of loading
  console.log("\n✓ All runtime logic checks passed.");
} finally {
  fs.unlinkSync(modPath);
}
