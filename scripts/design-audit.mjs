// Design burn-down audit: counts patterns the design overhaul removes.
// Usage: bun run design:audit   (or: node scripts/design-audit.mjs)
// Prints `name count` per check, then its top 5 files. No dependencies.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const srcDir = join(root, "src");

const palette =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink";

// `ts: true` also scans .ts files; every check scans .tsx.
const checks = [
  { name: "router-refresh", re: /router\.refresh\(\)/g },
  { name: "revalidate-seconds", re: /revalidateTag\([^)]*"seconds"\)/g, ts: true },
  { name: "img-tag", re: /<img[\s>]/g },
  {
    name: "palette-classes",
    re: new RegExp(
      `\\b(bg|text|border|from|to|via|ring|fill|stroke|divide|outline|shadow)-(${palette})-\\d{2,3}`,
      "g",
    ),
  },
  { name: "font-serif", re: /\bfont-serif\b/g },
  { name: "motion-elements", re: /<motion\./g },
  { name: "blur-layers", re: /(^|[\s"'`])blur-(\[\d+px\]|xl|2xl|3xl)/gm },
  { name: "backdrop-blur-large", re: /backdrop-blur-(md|lg|xl|2xl|3xl|\[)/g },
  { name: "mix-blend", re: /\bmix-blend-/g },
  {
    name: "undefined-animations",
    re: /animate-(slide-up|fade-in|scale-in|bounce-slow|float|fade-up)\b/g,
  },
  { name: "transition-all", re: /\btransition-all\b/g },
  { name: "link-wrapping-button", re: /<Link[^>]*>\s*<Button/g },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(srcDir).map((full) => ({
  path: relative(root, full).split(sep).join("/"),
  tsx: full.endsWith(".tsx"),
  text: readFileSync(full, "utf8"),
}));

const width = Math.max(...checks.map((c) => c.name.length));

for (const check of checks) {
  const perFile = [];
  for (const file of files) {
    if (!file.tsx && !check.ts) continue;
    const count = [...file.text.matchAll(check.re)].length;
    if (count) perFile.push([file.path, count]);
  }
  const total = perFile.reduce((sum, [, n]) => sum + n, 0);
  perFile.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  console.log(`${check.name.padEnd(width)} ${total}${total ? `  (${perFile.length} files)` : ""}`);
  for (const [path, n] of perFile.slice(0, 5)) console.log(`    ${String(n).padStart(4)}  ${path}`);
}
