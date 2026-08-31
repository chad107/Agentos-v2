/**
 * Lightweight smoke test: transforms every .ts/.tsx file under src/ with
 * esbuild to catch syntax errors, without needing `npm install` (this
 * sandbox cannot reach the npm registry — see BUILD_STATUS.md). This does
 * NOT type-check across files; it only proves each file parses/transforms.
 * Run: node scripts/syntax-check.js
 */
const fs = require("fs");
const path = require("path");

const esbuildPath = "/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild";
const esbuild = require(esbuildPath);

const root = path.join(__dirname, "..", "src");
let checked = 0;
let failed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      checked += 1;
      const code = fs.readFileSync(full, "utf8");
      const loader = entry.name.endsWith(".tsx") ? "tsx" : "ts";
      try {
        esbuild.transformSync(code, { loader, jsx: "automatic", target: "es2020" });
      } catch (err) {
        failed += 1;
        console.error(`\n✗ ${path.relative(root, full)}`);
        console.error(err.message);
      }
    }
  }
}

walk(root);
console.log(`\nChecked ${checked} files, ${failed} failed syntax transform.`);
process.exit(failed > 0 ? 1 : 0);
