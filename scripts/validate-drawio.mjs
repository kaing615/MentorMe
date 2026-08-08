import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const defaultFiles = [
  "docs/diagrams/mentorme-c4.drawio",
  "docs/diagrams/mentorme-domain.drawio",
  "docs/diagrams/mentorme-flows.drawio",
];

export function validateDrawioText(content, fileName = "diagram.drawio") {
  const errors = [];
  if (!/^<\?xml[^>]+>\s*<mxfile\b/.test(content)) {
    errors.push(`${fileName}: missing XML declaration or mxfile root`);
  }

  const pages = [...content.matchAll(/<diagram\b[^>]*>([\s\S]*?)<\/diagram>/g)];
  if (pages.length === 0) errors.push(`${fileName}: no diagram pages`);

  for (const [pageIndex, page] of pages.entries()) {
    const body = page[1];
    const ids = [...body.matchAll(/<mxCell\b[^>]*\bid="([^"]+)"/g)].map(
      (match) => match[1]
    );
    const known = new Set(ids);
    if (!known.has("0") || !known.has("1")) {
      errors.push(`${fileName}: page ${pageIndex + 1} lacks root cells 0 and 1`);
    }
    if (known.size !== ids.length) {
      errors.push(`${fileName}: page ${pageIndex + 1} has duplicate cell ids`);
    }

    for (const edge of body.matchAll(
      /<mxCell\b([^>]*\bedge="1"[^>]*)>([\s\S]*?)<\/mxCell>/g
    )) {
      const id = edge[1].match(/\bid="([^"]+)"/)?.[1] ?? "unknown";
      if (!/<mxGeometry\b[^>]*\brelative="1"[^>]*\bas="geometry"/.test(edge[2])) {
        errors.push(`${fileName}: edge ${id} has no relative geometry`);
      }
      for (const attribute of ["source", "target"]) {
        const referenced = edge[1].match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1];
        if (referenced && !known.has(referenced)) {
          errors.push(`${fileName}: edge ${id} has unknown ${attribute} ${referenced}`);
        }
      }
    }

    for (const edge of body.matchAll(/<mxCell\b([^>]*\bedge="1"[^>]*)\/>/g)) {
      const id = edge[1].match(/\bid="([^"]+)"/)?.[1] ?? "unknown";
      errors.push(`${fileName}: edge ${id} has no relative geometry`);
    }
  }
  return errors;
}

export function validateDrawioFile(filePath) {
  return validateDrawioText(fs.readFileSync(filePath, "utf8"), filePath);
}

function main() {
  const files = process.argv.slice(2);
  const selected = files.length > 0 ? files : defaultFiles;
  const errors = selected.flatMap((file) => validateDrawioFile(path.resolve(file)));
  if (errors.length > 0) {
    process.stderr.write(`${errors.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Draw.io structure valid (${selected.length} files).\n`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
