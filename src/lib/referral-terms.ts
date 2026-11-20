import { formatBDT } from "@/lib/money";
import { scopeText } from "@/lib/referral";
import type { ReferralSideTerms, ReferralTerms } from "@/services/referral/types";
import type { ReferralSettings } from "@/services/settings/getPublicSettings";

/**
 * The referral terms in force, read from the public settings
 * (`referralSettingsOf`), in the same shape `GET /referrals/me` sends. For
 * pages that have no lookup of their own (register, the terms page, the
 * invite page's signed-in state). Every number on those pages comes from here.
 */
export const referralTermsOf = (s: ReferralSettings): ReferralTerms => ({
  friend: {
    percent: s["referral.refereePercent"],
    maxDiscountMinor: s["referral.refereeMaxDiscountMinor"],
    minOrderMinor: s["referral.minOrderMinor"],
    validDays: s["referral.refereeValidDays"],
    scope: s["referral.refereeScope"],
  },
  you: {
    percent: s["referral.referrerPercent"],
    maxDiscountMinor: s["referral.referrerMaxDiscountMinor"],
    minOrderMinor: s["referral.minOrderMinor"],
    validDays: s["referral.referrerValidDays"],
    scope: s["referral.referrerScope"],
    trigger: s["referral.referrerTrigger"],
  },
  maxPerMonth: s["referral.maxRewardsPerMonth"],
  attributionDays: s["referral.attributionDays"],
});

/** 5 → "5%", 5.5 → "5.5%". */
export const percentLabel = (percent: number) => `${Math.round(percent * 100) / 100}%`;

/** "1 day" / "30 days". */
export const daysLabel = (days: number) => `${days} ${days === 1 ? "day" : "days"}`;

/**
 * The small print under a reward, as separate parts to join with " · ":
 * the cap (left out when there is none), the minimum order (when there is
 * one), where it works and how long it lasts.
 */
export const rewardFinePrint = (
  t: ReferralSideTerms,
  validFrom: "joining" | "earning",
): string[] => {
  const parts = [
    t.maxDiscountMinor > 0 ? `up to ${formatBDT(t.maxDiscountMinor)}` : null,
    t.minOrderMinor > 0 ? `on bookings of ${formatBDT(t.minOrderMinor)} or more` : null,
    scopeText(t.scope),
    `use within ${daysLabel(t.validDays)} of ${validFrom === "joining" ? "joining" : "earning it"}`,
  ].filter((part): part is string => !!part);
  parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return parts;
};
