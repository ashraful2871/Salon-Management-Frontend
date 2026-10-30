/**
 * MIRROR of the API's Home Service policy code. Change both together:
 *
 * - `buildDisclaimer` / `requiresAcceptance` ⇔ `modules/HomeService/home.policy.ts`
 * - `snapshotOf` / `decideOutcome` / `splitFee` ⇔ `modules/HomeService/home.cancel.ts`
 *
 * The API stays the authority: a quote carries its own `disclaimer` and the
 * booking stores `disclaimerText`, and a real cancel is priced by
 * `GET /bookings/:id/cancel-quote`. This copy is for what has no server answer
 * yet — the admin's live preview while editing the policy, and the cancel
 * dialog's fallback when the cancel quote can't be loaded.
 */

import type { AdminSetting } from "@/services/admin/settings/types";
import type {
  HomeBookingStatus,
  HomeCancelPolicy,
  HomeDisclaimerOverrides,
  HomeOutcome,
  HomePolicy,
} from "@/services/home-service/types";
import { formatBDT } from "./money";
import { SITE } from "./site";

export type DisclaimerLang = "en" | "bn";

/** A policy plus the admin's per-policy text (empty = generated). */
export type HomePolicyWithText = HomePolicy & { overrides?: HomeDisclaimerOverrides };

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;

// ---------------------------------------------------------------- disclaimer

const pctOf = (minor: number, percent: number) => Math.round((minor * percent) / 100);

const reschedule = (n: number, lang: DisclaimerLang) => {
  if (n <= 0) return "";
  if (lang === "bn") return n === 1 ? " আপনি একবার সময় পরিবর্তন করতে পারবেন।" : ` আপনি ${n} বার সময় পরিবর্তন করতে পারবেন।`;
  return n === 1 ? " You can reschedule once." : ` You can reschedule up to ${n} times.`;
};

const generated = (p: HomePolicy, advanceMinor: number, lang: DisclaimerLang): string => {
  const x = formatBDT(advanceMinor);
  const n = p.noShowPercent;
  const noShow =
    n > 0
      ? lang === "bn"
        ? ` আপনি বাসায় না থাকলে ${n}% রেখে দেওয়া হবে।`
        : ` If you are not home, ${n}% is kept.`
      : "";

  if (p.policy === "FREE") {
    return lang === "bn"
      ? `ফ্রি বাতিল: ভিজিটের আগে যেকোনো সময় বাতিল করলে আপনার ${x} অগ্রিম ওয়ালেটে ফেরত আসবে।${noShow}`
      : `Free cancellation: cancel any time before the visit and your ${x} advance comes back to your wallet.${noShow}`;
  }

  if (p.policy === "WINDOW") {
    const h = p.freeCancelHours;
    const y = formatBDT(pctOf(advanceMinor, p.lateCancelPercent));
    return lang === "bn"
      ? `ভিজিটের ${h} ঘণ্টা আগে পর্যন্ত ফ্রি বাতিল। এরপর বাতিল করলে আপনার অগ্রিমের ${p.lateCancelPercent}% (${y}) ফেরতযোগ্য নয়।${noShow}`
      : `Free cancellation until ${h} hours before the visit. After that, ${p.lateCancelPercent}% of your advance (${y}) is non-refundable.${noShow}`;
  }

  const g = p.nonRefundableGraceMinutes;
  const grace =
    g > 0
      ? lang === "bn"
        ? ` পেমেন্টের ${g} মিনিটের মধ্যে মত বদলালে এবং ভিজিট অন্তত ${p.freeCancelHours} ঘণ্টা পরে হলে, তখনও ফ্রি বাতিল করতে পারবেন।`
        : ` If you change your mind within ${g} minutes of paying and the visit is at least ${p.freeCancelHours} hours away, you can still cancel for free.`
      : "";
  return lang === "bn"
    ? `${x} অগ্রিম বাতিল করলে বা আপনি বাসায় না থাকলে ফেরতযোগ্য নয়।${reschedule(p.maxRescheduleCount, lang)} সেলুন বা ${SITE.name} বাতিল করলে পুরো টাকা ফেরত পাবেন।${grace}`
    : `This advance of ${x} is non-refundable if you cancel or are not home.${reschedule(p.maxRescheduleCount, lang)} If the salon or ${SITE.name} cancels, you get the full amount back.${grace}`;
};

/** The admin's `disclaimer.<policy>` text when set (one text, both languages), else the generated one. */
export const buildDisclaimer = (p: HomePolicyWithText, advanceMinor: number, lang: DisclaimerLang): string =>
  p.overrides?.[p.policy] || generated(p, advanceMinor, lang);

/**
 * The disclaimer's short form, for badges and the landing (no amounts, so it
 * needs no cart). Frontend only: the API has no short form to mirror.
 */
export const policyShortLine = (p: Pick<HomePolicy, "policy" | "freeCancelHours" | "maxRescheduleCount">) => {
  if (p.policy === "FREE") return "Free cancellation";
  if (p.policy === "WINDOW") return `Free cancellation until ${p.freeCancelHours} h before`;
  const n = p.maxRescheduleCount;
  if (n <= 0) return "Advance is non-refundable";
  return `Advance is non-refundable — reschedule ${n === 1 ? "once" : `up to ${n} times`} for free`;
};

/** Nothing to agree to only when the advance always comes back. */
export const requiresAcceptance = (p: Pick<HomePolicy, "policy" | "noShowPercent">) =>
  !(p.policy === "FREE" && p.noShowPercent === 0);

// ---------------------------------------------------------------- outcome

export type HomeEndEvent =
  | { kind: "CUSTOMER_CANCEL"; now: Date }
  | { kind: "CUSTOMER_NO_SHOW" }
  | { kind: "MISMATCH_ABORT" }
  | { kind: "SALON_CANCEL" }
  | { kind: "EXPERT_NO_SHOW" }
  | { kind: "ADMIN_CANCEL"; salonAtFault: boolean }
  | { kind: "SYSTEM_CANCEL" }
  | { kind: "SAFETY_ABORT" };

export type HomeDecisionInput = {
  status: HomeBookingStatus;
  startAt: Date;
  advanceMinor: number;
  confirmedAt: Date | null;
  policySnapshot: unknown;
};

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const clampPct = (v: number) => Math.min(100, Math.max(0, v));

/** A booking's snapshot, with launch defaults for anything missing (fees 0, i.e. in the customer's favour). */
export const snapshotOf = (raw: unknown): HomePolicy => {
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    policy: s.policy === "WINDOW" || s.policy === "NON_REFUNDABLE" ? s.policy : "FREE",
    version: num(s.version, 0),
    freeCancelHours: num(s.freeCancelHours, 3),
    lateCancelPercent: clampPct(num(s.lateCancelPercent, 0)),
    noShowPercent: clampPct(num(s.noShowPercent, 0)),
    nonRefundableGraceMinutes: Math.max(0, num(s.nonRefundableGraceMinutes, 0)),
    salonCancelCreditMinor: Math.max(0, Math.round(num(s.salonCancelCreditMinor, 0))),
    feeSalonSharePercent: clampPct(num(s.feeSalonSharePercent, 100)),
    appealWindowHours: Math.max(0, num(s.appealWindowHours, 48)),
    maxRescheduleCount: Math.max(0, num(s.maxRescheduleCount, 1)),
  };
};

const roundToTaka = (minor: number) => Math.round(minor / 100) * 100;

/** The salon's part of a kept fee; the platform gets the rest. */
export const splitFee = (feeMinor: number, feeSalonSharePercent: number) => {
  const salonShareMinor = Math.round((feeMinor * clampPct(feeSalonSharePercent)) / 100);
  return { salonShareMinor, platformShareMinor: feeMinor - salonShareMinor };
};

const customerCancelPct = (b: HomeDecisionInput, p: HomePolicy, now: Date): [number, string] => {
  const freeWindowLeft = b.startAt.getTime() - now.getTime() >= p.freeCancelHours * HOUR_MS;
  if (p.policy === "FREE") return [0, "FREE_CANCEL"];
  if (p.policy === "WINDOW") {
    return freeWindowLeft && b.status === "CONFIRMED" ? [0, "WINDOW_FREE"] : [p.lateCancelPercent, "WINDOW_LATE"];
  }
  const inGrace =
    p.nonRefundableGraceMinutes > 0 &&
    !!b.confirmedAt &&
    now.getTime() - b.confirmedAt.getTime() <= p.nonRefundableGraceMinutes * MIN_MS &&
    freeWindowLeft;
  return inGrace ? [0, "NON_REFUNDABLE_GRACE"] : [100, "NON_REFUNDABLE"];
};

/** What an end returns: the API's `decideOutcome`, line for line. */
export const decideOutcome = (b: HomeDecisionInput, event: HomeEndEvent): HomeOutcome => {
  const p = snapshotOf(b.policySnapshot);
  const paid = b.status === "PENDING_PAYMENT" || b.status === "EXPIRED" ? 0 : b.advanceMinor;

  let pct = 0;
  let credit = 0;
  let reasonCode: string;
  switch (event.kind) {
    case "CUSTOMER_CANCEL":
      [pct, reasonCode] = customerCancelPct(b, p, event.now);
      break;
    case "CUSTOMER_NO_SHOW":
    case "MISMATCH_ABORT":
      pct = p.policy === "NON_REFUNDABLE" ? 100 : p.noShowPercent;
      reasonCode = event.kind;
      break;
    case "SALON_CANCEL":
    case "EXPERT_NO_SHOW":
      credit = p.salonCancelCreditMinor;
      reasonCode = event.kind;
      break;
    case "ADMIN_CANCEL":
      credit = event.salonAtFault ? p.salonCancelCreditMinor : 0;
      reasonCode = event.salonAtFault ? "ADMIN_CANCEL_SALON_FAULT" : "ADMIN_CANCEL";
      break;
    default:
      reasonCode = event.kind;
  }
  if (paid <= 0) {
    return { feeMinor: 0, feePercent: 0, refundMinor: 0, salonShareMinor: 0, platformShareMinor: 0, salonCreditMinor: 0, reasonCode: "NOT_PAID" };
  }

  const feeMinor = Math.min(paid, roundToTaka((paid * pct) / 100));
  return {
    feeMinor,
    feePercent: pct,
    refundMinor: paid - feeMinor,
    ...splitFee(feeMinor, p.feeSalonSharePercent),
    salonCreditMinor: credit,
    reasonCode,
  };
};

/** A "what if" for the preview: relative times instead of a booking's dates. */
export type HomePreviewScenario =
  | {
      kind: "CUSTOMER_CANCEL";
      /** How long before the start the customer cancels. */
      hoursBefore: number;
      /** How long after paying (for the NON_REFUNDABLE grace). Default: long ago. */
      minutesSincePaid?: number;
      /** Default CONFIRMED; EN_ROUTE / ARRIVED are never free under WINDOW. */
      status?: Extract<HomeBookingStatus, "CONFIRMED" | "EN_ROUTE" | "ARRIVED">;
    }
  | Exclude<HomeEndEvent, { kind: "CUSTOMER_CANCEL" }>;

/** `decideOutcome` for a paid visit under `policy`, as the scenario describes it. */
export const previewOutcome = (
  policy: HomePolicy,
  advanceMinor: number,
  scenario: HomePreviewScenario,
  now = new Date(),
): HomeOutcome => {
  if (scenario.kind !== "CUSTOMER_CANCEL") {
    return decideOutcome(
      { status: "CONFIRMED", startAt: now, advanceMinor, confirmedAt: null, policySnapshot: policy },
      scenario,
    );
  }
  const startAt = new Date(now.getTime() + scenario.hoursBefore * HOUR_MS);
  const confirmedAt =
    scenario.minutesSincePaid === undefined ? null : new Date(now.getTime() - scenario.minutesSincePaid * MIN_MS);
  return decideOutcome(
    { status: scenario.status ?? "CONFIRMED", startAt, advanceMinor, confirmedAt, policySnapshot: policy },
    { kind: "CUSTOMER_CANCEL", now },
  );
};

// ---------------------------------------------------------------- from the settings page

const POLICY_KEYS = {
  freeCancelHours: "homeService.freeCancelHours",
  lateCancelPercent: "homeService.lateCancelPercent",
  noShowPercent: "homeService.noShowPercent",
  nonRefundableGraceMinutes: "homeService.nonRefundableGraceMinutes",
  salonCancelCreditMinor: "homeService.salonCancelCreditMinor",
  feeSalonSharePercent: "homeService.feeSalonSharePercent",
  appealWindowHours: "homeService.appealWindowHours",
  maxRescheduleCount: "homeService.maxRescheduleCount",
} as const satisfies Record<string, string>;

/** Every setting whose save changes `version` (the API's `currentPolicy`). */
export const HOME_POLICY_SETTING_KEYS = [
  "homeService.customerCancelPolicy",
  ...Object.values(POLICY_KEYS),
  "homeService.disclaimer.free",
  "homeService.disclaimer.window",
  "homeService.disclaimer.nonRefundable",
] as const;

/**
 * The policy in force from the admin settings rows, with the same `version`
 * (sum of row versions) the API computes. `values` overrides rows for a
 * preview of unsaved edits.
 */
export const policyFromSettings = (
  settings: AdminSetting[],
  values: Record<string, unknown> = {},
): HomePolicyWithText => {
  const byKey = new Map(settings.map((s) => [s.key, s]));
  const read = (key: string) => (key in values ? values[key] : byKey.get(key)?.value);
  const text = (key: string) => String(read(key) ?? "").trim();
  const policy = read("homeService.customerCancelPolicy");
  const snapshot = snapshotOf({
    policy,
    ...Object.fromEntries(Object.entries(POLICY_KEYS).map(([field, key]) => [field, read(key)])),
  });
  return {
    ...snapshot,
    version: HOME_POLICY_SETTING_KEYS.reduce((sum, key) => sum + (byKey.get(key)?.version ?? 0), 0),
    overrides: {
      FREE: text("homeService.disclaimer.free"),
      WINDOW: text("homeService.disclaimer.window"),
      NON_REFUNDABLE: text("homeService.disclaimer.nonRefundable"),
    } satisfies Record<HomeCancelPolicy, string>,
  };
};
