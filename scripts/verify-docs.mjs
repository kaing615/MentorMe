import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { validateDrawioFile } from "./validate-drawio.mjs";

const root = process.cwd();
const required = [
  "docs/system-design/README.md",
  "docs/system-design/current-architecture.md",
  "docs/system-design/target-architecture.md",
  "docs/system-design/quality-attributes.md",
  "docs/system-design/consistency-and-events.md",
  "docs/system-design/security.md",
  "docs/system-design/testing-strategy.md",
  "docs/system-design/operations-runbook.md",
  "docs/system-design/acceptance-traceability.md",
  "docs/adr/0001-scaled-modular-monolith.md",
  "docs/adr/0002-redis-shared-state.md",
  "docs/adr/0003-rabbitmq-outbox.md",
  "docs/adr/0004-single-vps-deployment.md",
  "docs/diagrams/mentorme-c4.drawio",
  "docs/diagrams/mentorme-domain.drawio",
  "docs/diagrams/mentorme-flows.drawio",
  "docs/diagrams/exports/mentorme-c4.svg",
  "docs/diagrams/exports/mentorme-domain.svg",
  "docs/diagrams/exports/mentorme-flows.svg",
];

const errors = [];

for (const relativePath of required) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`missing: ${relativePath}`);
    continue;
  }

  if (!relativePath.endsWith(".md")) continue;
  const content = fs.readFileSync(absolutePath, "utf8");
  if (/\b(?:TBD|TODO|FIXME)\b/i.test(content)) {
    errors.push(`unfinished marker: ${relativePath}`);
  }
  if (
    relativePath.startsWith("docs/system-design/") &&
    relativePath !== "docs/system-design/README.md" &&
    !/^\*\*Implementation status:\*\* (?:Current|Target|Mixed)$/m.test(content)
  ) {
    errors.push(`missing implementation status: ${relativePath}`);
  }

  for (const match of content.matchAll(/\[[^\]]+\]\((?!https?:|#)([^)]+)\)/g)) {
    const target = match[1].split("#", 1)[0];
    const resolved = path.resolve(path.dirname(absolutePath), target);
    if (!fs.existsSync(resolved)) {
      errors.push(`broken link: ${relativePath} -> ${match[1]}`);
    }
  }
}

for (const relativePath of required.filter((file) => file.endsWith(".drawio"))) {
  const absolutePath = path.join(root, relativePath);
  if (fs.existsSync(absolutePath)) errors.push(...validateDrawioFile(absolutePath));
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Documentation contract satisfied (${required.length} artifacts).\n`);
}
