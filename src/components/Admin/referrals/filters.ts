import { dhakaDay, previousRange } from "@/components/Admin/analytics/filters";

/**
 * The Referrals overview's filter row, in the URL like Analytics:
 * `?range=30d&test=1` (+ `from`/`to` when `range=custom`). Dhaka days, as
 * the API counts them; at most 400 days.
 */
export const REFERRAL_PRESETS = [
  { value: "7d", label: "7 d", days: 7 },
  { value: "30d", label: "30 d", days: 30 },
  { value: "90d", label: "90 d", days: 90 },
  { value: "month", label: "This month", days: 0 },
] as const;

export type ReferralRange = {
  range: string;
  from: string;
  to: string;
  includeTest: boolean;
  compare: "none";
};

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 400;

export function parseReferralRange(params: Params): ReferralRange {
  const today = dhakaDay(new Date());
  const range = first(params.range);
  const includeTest = first(params.test) === "1";
  const from = first(params.from);
  const to = first(params.to);

  if (range === "custom" && from && DAY.test(from)) {
    const end = to && DAY.test(to) && to >= from && to <= today ? to : today;
    const span = Math.round((Date.parse(end) - Date.parse(from)) / DAY_MS) + 1;
    const start = span > MAX_DAYS ? dhakaDay(new Date(Date.parse(end) - (MAX_DAYS - 1) * DAY_MS)) : from;
    return { range: "custom", from: start <= end ? start : end, to: end, includeTest, compare: "none" };
  }
  if (range === "month") {
    return { range: "month", from: `${today.slice(0, 8)}01`, to: today, includeTest, compare: "none" };
  }
  const preset = REFERRAL_PRESETS.find((p) => p.value === range && p.days > 0) ?? REFERRAL_PRESETS[1];
  return {
    range: preset.value,
    from: dhakaDay(new Date(Date.now() - (preset.days - 1) * DAY_MS)),
    to: today,
    includeTest,
    compare: "none",
  };
}

/** The period just before, of the same length, for the tiles' deltas. */
export const previousOf = (r: ReferralRange) => previousRange(r.from, r.to);

/** The 1st of this month (Dhaka), what the monthly cap counts from. */
export const monthStartDhaka = () => `${dhakaDay(new Date()).slice(0, 8)}01`;

/** `/api/admin/export/referrals/<type>.csv?…` under the overview's range. */
export const referralCsvHref = (type: "referrals" | "rewards", r: Pick<ReferralRange, "from" | "to" | "includeTest">) => {
  const q = new URLSearchParams();
  if (type === "referrals") {
    q.set("from", r.from);
    q.set("to", r.to);
  }
  if (r.includeTest) q.set("includeTest", "1");
  const query = q.toString();
  return `/api/admin/export/referrals/${type}.csv${query ? `?${query}` : ""}`;
};
