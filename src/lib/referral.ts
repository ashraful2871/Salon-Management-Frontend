import { formatBDT } from "@/lib/money";

/**
 * Referral maths for previews only: a copy of the API's
 * `modules/Referral/referral.math.ts` with identical results. The server
 * decides every discount; this only lets a page show the same number before
 * it asks. `scripts/referral-parity.ts` runs both on random cases and must
 * report 0 differences - change the two files together.
 *
 * Money is integer poisha. A discount is floored to whole taka.
 */

/** The invite link's code (httpOnly, `referral.attributionDays`; set by `/r/[code]`). */
export const REF_COOKIE = "sm_ref";
/** A random device id (httpOnly, 2 years; set by the proxy), sent as `X-Device-Id`. */
export const DEVICE_COOKIE = "sm_did";

export type Scope = "ALL" | "SALON" | "HOME";
export type BookingKind = "SALON" | "HOME";

/** The terms a reward was issued with (its snapshot). `expiresAt` as the API sends it or a Date. */
export type RewardTerms = {
  id: string;
  kind: string;
  percentBps: number;
  maxDiscountMinor: number;
  minOrderMinor: number;
  scope: Scope;
  firstBookingOnly: boolean;
  expiresAt: Date | string;
};

/**
 * `baseMinor`: the salon booking's `totalMinor`, or the home visit's
 * `subtotalMinor` (never the travel fee). `completedBookings`: the customer's
 * COMPLETED appointments + home visits.
 */
export type ApplyCtx = {
  kind: BookingKind;
  baseMinor: number;
  completedBookings: number;
  now: Date;
};

export type NotApplicable = "EXPIRED" | "SCOPE" | "MIN_ORDER" | "FIRST_BOOKING_DONE" | "TOO_SMALL";

export type Applied = { reward: RewardTerms; discountMinor: number };

/** Below this (৳1) a discount is not worth applying. */
const MIN_DISCOUNT_MINOR = 100;

const timeOf = (d: Date | string) => (d instanceof Date ? d.getTime() : new Date(d).getTime());

/**
 * `min( floor_to_taka(base × bps / 10 000), cap || ∞, base )`, and 0 when that
 * is under ৳1. A cap of 0 means no cap.
 */
export const rewardDiscountMinor = (
  baseMinor: number,
  percentBps: number,
  maxDiscountMinor: number,
): number => {
  if (!Number.isFinite(baseMinor) || !Number.isFinite(percentBps) || baseMinor <= 0 || percentBps <= 0) {
    return 0;
  }
  const base = Math.floor(baseMinor);
  let d = Math.floor((base * Math.floor(percentBps)) / 1_000_000) * 100;
  if (maxDiscountMinor > 0) d = Math.min(d, Math.floor(maxDiscountMinor));
  d = Math.min(d, base);
  return d < MIN_DISCOUNT_MINOR ? 0 : d;
};

/**
 * Can this reward be used on this booking, and for how much? Same order as the
 * API: expired, first booking already done, scope, minimum, too small.
 */
export const applicability = (
  r: RewardTerms,
  ctx: ApplyCtx,
): { ok: true; discountMinor: number } | { ok: false; reason: NotApplicable } => {
  if (!(timeOf(r.expiresAt) > ctx.now.getTime())) return { ok: false, reason: "EXPIRED" };
  if (r.firstBookingOnly && ctx.completedBookings > 0) return { ok: false, reason: "FIRST_BOOKING_DONE" };
  if (r.scope !== "ALL" && r.scope !== ctx.kind) return { ok: false, reason: "SCOPE" };
  if (r.minOrderMinor > 0 && ctx.baseMinor < r.minOrderMinor) return { ok: false, reason: "MIN_ORDER" };
  const discountMinor = rewardDiscountMinor(ctx.baseMinor, r.percentBps, r.maxDiscountMinor);
  if (discountMinor === 0) return { ok: false, reason: "TOO_SMALL" };
  return { ok: true, discountMinor };
};

/** The largest discount first, ties to the earliest expiry, then the id. */
export const pickBest = (
  rewards: RewardTerms[],
  ctx: ApplyCtx,
): {
  best: Applied | null;
  options: Applied[];
  notApplicable: { reward: RewardTerms; reason: NotApplicable }[];
} => {
  const options: Applied[] = [];
  const notApplicable: { reward: RewardTerms; reason: NotApplicable }[] = [];
  for (const reward of rewards) {
    const a = applicability(reward, ctx);
    if (a.ok) options.push({ reward, discountMinor: a.discountMinor });
    else notApplicable.push({ reward, reason: a.reason });
  }
  options.sort(
    (a, b) =>
      b.discountMinor - a.discountMinor ||
      timeOf(a.reward.expiresAt) - timeOf(b.reward.expiresAt) ||
      (a.reward.id < b.reward.id ? -1 : a.reward.id > b.reward.id ? 1 : 0),
  );
  return { best: options[0] ?? null, options, notApplicable };
};

/* ---------------------------------------------------------------- codes */

const CODE_SHAPE = /^[A-Z2-9]{6,12}$/;

/**
 * A typed or linked code as it is stored, or null when it can't be one. Trims,
 * drops spaces and dashes (including U+2010–U+2015, which phones auto-correct
 * to), upper-cases, and reads a zero as the letter O.
 */
export const normalizeCode = (raw: string): string | null => {
  if (typeof raw !== "string") return null;
  const code = raw
    .trim()
    .replace(/[\s\-‐-―]+/g, "")
    .toUpperCase()
    .replace(/0/g, "O");
  return CODE_SHAPE.test(code) ? code : null;
};

/* ---------------------------------------------------------------- text */

/** 500 → "5", 550 → "5.5", 1234 → "12.34". */
const percentText = (percent: number) => String(Math.round(percent * 100) / 100);

export const rewardLabel = (kind: string, percentBps: number): string => {
  const p = `${percentText(percentBps / 100)}%`;
  if (kind === "REFEREE_WELCOME") return `Welcome reward (${p})`;
  if (kind === "REFERRER_BONUS") return `Referral reward (${p})`;
  return `Reward (${p})`;
};

/**
 * The share text with `{percent}` `{code}` `{link}` `{site}` `{cap}` filled
 * in. A cap of 0 reads "no limit". Unknown placeholders are left as typed.
 */
export const fillShareMessage = (
  tpl: string,
  v: { percent: number; code: string; link: string; site: string; capMinor: number },
): string => {
  const values: Record<string, string> = {
    percent: percentText(v.percent),
    code: v.code,
    link: v.link,
    site: v.site,
    cap: v.capMinor > 0 ? formatBDT(v.capMinor) : "no limit",
  };
  return tpl.replace(/\{(percent|code|link|site|cap)\}/g, (_, k: string) => values[k]);
};

/** Where a reward can be used, as the pages say it. */
export const scopeText = (scope: Scope): string =>
  scope === "SALON" ? "salon bookings" : scope === "HOME" ? "Home Service" : "salon bookings and Home Service";
