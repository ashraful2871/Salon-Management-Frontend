/**
 * `bun run scripts/referral-parity.ts`: the frontend's preview maths
 * (`src/lib/referral.ts`) against the API's `referral.math.ts`, on seeded
 * random cases. Any difference is a bug in the mirror; 0 is required.
 *
 * 5,000 discount cases across base × bps × cap, plus applicability, pickBest,
 * normalizeCode, rewardLabel and fillShareMessage. Exits 1 on any difference.
 */
import * as fe from "../src/lib/referral";
import * as be from "../../Salon-Management-Server/src/app/modules/Referral/referral.math";

// mulberry32: the same cases on every run.
let seed = 0x5eed2026;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(xs: readonly T[]): T => xs[int(0, xs.length - 1)];

let cases = 0;
const diffs: string[] = [];
const same = (label: string, a: unknown, b: unknown) => {
  cases += 1;
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  if (x !== y && diffs.length < 20) diffs.push(`${label}: frontend ${x} · backend ${y}`);
  else if (x !== y) diffs.push(label);
};

// Bases: whole taka, odd poisha, tiny, huge, zero and negative edges.
const base = () =>
  pick([
    () => int(0, 5_000) * 100,
    () => int(1, 2_000_000),
    () => int(0, 300),
    () => int(-500, 0),
    () => int(1, 100) * 1_000_000,
  ])();
const bps = () => pick([() => int(1, 5_000), () => int(0, 10_000), () => pick([100, 500, 550, 1000, 1234, 5000]), () => int(-100, 0)])();
const cap = () => pick([() => 0, () => int(1, 500_000), () => int(1, 50) * 10_000, () => int(1, 199)])();

const DISCOUNT_CASES = 5_000;
for (let i = 0; i < DISCOUNT_CASES; i++) {
  const b = base();
  const p = bps();
  const c = cap();
  same(`rewardDiscountMinor(${b}, ${p}, ${c})`, fe.rewardDiscountMinor(b, p, c), be.rewardDiscountMinor(b, p, c));
}
const discountCases = cases;

// Rewards and contexts for applicability and pickBest.
const NOW = new Date("2026-11-20T06:00:00.000Z");
const scopes = ["ALL", "SALON", "HOME"] as const;
const kinds = ["REFEREE_WELCOME", "REFERRER_BONUS", "MANUAL_GRANT"] as const;
const reward = (i: number) => ({
  id: `r${String(int(0, 99)).padStart(2, "0")}-${i}`,
  kind: pick(kinds),
  percentBps: bps(),
  maxDiscountMinor: cap(),
  minOrderMinor: pick([0, 0, int(1, 300_000)]),
  scope: pick(scopes),
  firstBookingOnly: rand() < 0.5,
  // Some expired, some exactly now, ties on purpose.
  expiresAt: new Date(NOW.getTime() + pick([-86_400_000, 0, 1, 3_600_000, 86_400_000, 86_400_000])),
});
const ctx = () => ({ kind: pick(["SALON", "HOME"] as const), baseMinor: base(), completedBookings: pick([0, 0, 1, 3]), now: NOW });
const plainPick = (r: ReturnType<typeof be.pickBest>) => ({
  best: r.best && { id: r.best.reward.id, d: r.best.discountMinor },
  options: r.options.map((o) => [o.reward.id, o.discountMinor]),
  notApplicable: r.notApplicable.map((n) => [n.reward.id, n.reason]),
});

for (let i = 0; i < 1_000; i++) {
  const r = reward(i);
  const c = ctx();
  same(`applicability #${i}`, fe.applicability(r, c), be.applicability(r, c));
}
for (let i = 0; i < 500; i++) {
  const list = Array.from({ length: int(0, 6) }, (_, k) => reward(k));
  const c = ctx();
  same(`pickBest #${i}`, plainPick(fe.pickBest(list, c) as never), plainPick(be.pickBest(list, c)));
}

// Codes: shapes, spaces, dashes (incl. U+2010–U+2015), zeros, lower case, junk.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdxyz0O1Il -‐‑‒–—―_.!";
for (let i = 0; i < 1_000; i++) {
  const s = Array.from({ length: int(0, 16) }, () => pick([...CHARS])).join("");
  same(`normalizeCode(${JSON.stringify(s)})`, fe.normalizeCode(s), be.normalizeCode(s));
}

for (let i = 0; i < 300; i++) {
  const k = pick([...kinds, "OTHER"]);
  const p = bps();
  same(`rewardLabel(${k}, ${p})`, fe.rewardLabel(k, p), be.rewardLabel(k, p));
}

const TEMPLATES = [
  "Get {percent}% off your first booking on {site} with my code {code}: {link}",
  "{code} {code} – up to {cap} off, {percent}% · {unknown} {link}",
  "No placeholders at all",
];
for (let i = 0; i < 300; i++) {
  const v = { percent: int(1, 5000) / 100, code: `CODE${i}`, link: `https://x.test/r/CODE${i}`, site: "Site", capMinor: cap() };
  const t = pick(TEMPLATES);
  same(`fillShareMessage #${i}`, fe.fillShareMessage(t, v), be.fillShareMessage(t, v));
}

console.log(`referral parity: ${discountCases} discount cases + ${cases - discountCases} rule/code/text cases`);
console.log(`${diffs.length} diffs`);
for (const d of diffs.slice(0, 20)) console.log(`  ${d}`);
process.exit(diffs.length ? 1 : 0);
