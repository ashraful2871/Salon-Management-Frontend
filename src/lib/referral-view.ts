import { fillShareMessage } from "@/lib/referral";
import { SITE } from "@/lib/site";
import type { MyReferral, ReferralReward, RewardScope } from "@/services/referral/types";

/**
 * Display helpers for the customer referral pages (Refer & earn, the
 * dashboard banner, the salon page hint). Dates read in Asia/Dhaka.
 */

const DHAKA = "Asia/Dhaka";

const ymdOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: DHAKA }).format(d);

/** Whole Dhaka calendar days from `now` to `iso` (0 = today, negative = past). */
const daysUntil = (iso: string, now: Date) => {
  const day = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86_400_000;
  };
  return day(ymdOf(new Date(iso))) - day(ymdOf(now));
};

/** "12 Nov", or "12 Nov 2027" outside the current year. */
export const shortDate = (iso: string, now: Date = new Date()) => {
  const d = new Date(iso);
  const sameYear = ymdOf(d).slice(0, 4) === ymdOf(now).slice(0, 4);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: DHAKA,
  }).format(d);
};

/** "Thursday, 12 November 2026", for a `title` next to a relative date. */
export const fullDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: DHAKA }).format(new Date(iso));

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "Expires today" / "Expires tomorrow" / "Expires in 5 days"; "Expired 12 Nov" once past. */
export const expiryText = (iso: string, now: Date) => {
  if (new Date(iso).getTime() <= now.getTime()) return `Expired ${shortDate(iso, now)}`;
  return `Expires ${relative.format(Math.max(daysUntil(iso, now), 0), "day")}`;
};

/** The share text from `GET /referrals/me` (filled by the API; any placeholder left is filled here). */
export const shareMessageOf = (me: MyReferral) =>
  fillShareMessage(me.shareMessage, {
    percent: me.terms.friend.percent,
    code: me.code,
    link: me.link,
    site: SITE.name,
    capMinor: me.terms.friend.maxDiscountMinor,
  });

export const worksForSalon = (scope: RewardScope) => scope !== "HOME";
export const worksForHome = (scope: RewardScope) => scope !== "SALON";

/** Where "Book now" goes for a reward: Home Service is booked from the parlour list. */
export const bookHrefFor = (scope: RewardScope) => (scope === "HOME" ? "/ladies-parlour" : "/salons");

/**
 * The reward a salon booking would most likely take, for the salon page's
 * hint: usable now, valid on salon bookings, then the same order as the API's
 * summary (highest percent, larger cap with 0 = none first, earliest expiry).
 * The quote still decides; this only says one will apply.
 */
export const bestSalonReward = (rewards: ReferralReward[], now: Date): ReferralReward | null => {
  const capRank = (m: number) => (m === 0 ? Number.MAX_SAFE_INTEGER : m);
  return (
    rewards
      .filter(
        (r) => r.status === "AVAILABLE" && worksForSalon(r.scope) && new Date(r.expiresAt).getTime() > now.getTime(),
      )
      .sort(
        (a, b) =>
          b.percent - a.percent ||
          capRank(b.maxDiscountMinor) - capRank(a.maxDiscountMinor) ||
          new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      )[0] ?? null
  );
};
