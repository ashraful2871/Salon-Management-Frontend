// WCAG contrast check for the design tokens in the `:root` block of globals.css.
// Usage: bun run contrast   (or: node scripts/contrast.mjs)
// Prints PASS / FAIL / MISSING per pair. Exits 1 only when a pair whose tokens
// both exist falls below its minimum; tokens not defined yet print MISSING.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");

// [foreground, background, minimum ratio]
const pairs = [
  ["foreground", "background", 4.5],
  ["foreground", "surface", 4.5],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "surface", 4.5],
  ["muted-foreground", "surface-subtle", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["muted-foreground", "cream", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["primary-foreground", "primary-hover", 4.5],
  ["primary-hover", "primary-soft", 4.5],
  ["primary", "surface", 4.5],
  ["destructive-foreground", "destructive", 4.5],
  ["success", "success-soft", 4.5],
  ["warning", "warning-soft", 4.5],
  ["danger", "danger-soft", 4.5],
  ["info", "info-soft", 4.5],
  ["success-foreground", "success", 4.5],
  ["input", "surface", 3.0],
  ["gold", "surface", 3.0],
];

// --- read the :root block (later declarations win, as in CSS) ---------------

function rootBlock(text) {
  const start = text.search(/:root\s*\{/);
  if (start < 0) throw new Error("no :root block in globals.css");
  const open = text.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i);
  }
  throw new Error("unterminated :root block in globals.css");
}

const tokens = new Map();
const block = rootBlock(css).replace(/\/\*[\s\S]*?\*\//g, "");
for (const [, name, value] of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
  tokens.set(name, value.trim());
}

// --- oklch -> sRGB -----------------------------------------------------------

const num = (s, percentOf) => (s.endsWith("%") ? (parseFloat(s) / 100) * percentOf : parseFloat(s));

function parseOklch(value) {
  const m = value.match(/^oklch\(\s*([^)]*)\)$/i);
  if (!m) return null;
  const [color, alpha] = m[1].split("/").map((part) => part.trim());
  const [L, C, H] = color.split(/\s+/);
  if (H === undefined) return null;
  return {
    L: num(L, 1),
    C: num(C, 0.4),
    H: parseFloat(H),
    A: alpha === undefined ? 1 : num(alpha, 1),
  };
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const encode = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const decode = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

// Returns gamma-encoded sRGB in 0..1 plus alpha.
function oklchToSrgb({ L, C, H, A }) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return { rgb: lin.map((c) => encode(clamp01(c))), A };
}

// Resolve a token to a color, following `var(--x)` one level.
function resolve(name) {
  let value = tokens.get(name);
  if (value === undefined) return { missing: true };
  const ref = value.match(/^var\(\s*--([\w-]+)\s*\)$/);
  if (ref) {
    value = tokens.get(ref[1]);
    if (value === undefined) return { missing: true };
  }
  const parsed = parseOklch(value);
  return parsed ? oklchToSrgb(parsed) : { unparsed: value };
}

// Browsers composite in gamma-encoded sRGB.
const over = (top, under) => top.rgb.map((c, i) => c * top.A + under[i] * (1 - top.A));
const luminance = (rgb) => {
  const [R, G, B] = rgb.map(decode);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

// --- check -------------------------------------------------------------------

const page = resolve("background");
const pageRgb = page.rgb ? over(page, [1, 1, 1]) : [1, 1, 1];

let failed = 0;
for (const [fgName, bgName, min] of pairs) {
  const label = `${fgName} on ${bgName}`.padEnd(42) + ` (min ${min.toFixed(1)})`;
  const fg = resolve(fgName);
  const bg = resolve(bgName);
  const missing = [fgName, bgName].filter((_, i) => [fg, bg][i].missing);
  if (missing.length) {
    console.log(`MISSING         ${label}  no --${missing.join(", --")}`);
    continue;
  }
  const unparsed = [[fgName, fg], [bgName, bg]].find(([, c]) => c.unparsed);
  if (unparsed) {
    console.log(`UNPARSED        ${label}  --${unparsed[0]}: ${unparsed[1].unparsed}`);
    continue;
  }
  const bgRgb = over(bg, pageRgb);
  const fgRgb = over(fg, bgRgb);
  const [hi, lo] = [luminance(fgRgb), luminance(bgRgb)].sort((a, b) => b - a);
  const ratio = (hi + 0.05) / (lo + 0.05);
  const pass = ratio >= min;
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${ratio.toFixed(2).padStart(6)}:1  ${label}`);
}

console.log(failed ? `\n${failed} pair(s) below minimum.` : "\nAll present pairs pass.");
process.exit(failed ? 1 : 0);
