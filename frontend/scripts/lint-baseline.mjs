import { readFile } from "node:fs/promises";
import { ESLint } from "eslint";

const baseline = JSON.parse(
  await readFile(new URL("../eslint-baseline.json", import.meta.url), "utf8")
);
const eslint = new ESLint();
const results = await eslint.lintFiles(["."]);
const errors = results.reduce((total, result) => total + result.errorCount, 0);
const warnings = results.reduce((total, result) => total + result.warningCount, 0);

console.log(`Frontend lint baseline: ${errors} errors, ${warnings} warnings`);
if (errors > baseline.maxErrors || warnings > baseline.maxWarnings) {
  console.error(
    `Lint debt regressed (allowed ${baseline.maxErrors} errors, ${baseline.maxWarnings} warnings).`
  );
  process.exitCode = 1;
}
