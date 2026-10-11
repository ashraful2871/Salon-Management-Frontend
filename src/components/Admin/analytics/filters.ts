import type { AnalyticsQuery } from "@/services/admin/analytics/types";

/**
 * The analytics filter row lives entirely in the URL:
 * `?range=30d&compare=prev&area=&channel=&test=0` (+ `from`/`to` when
 * `range=custom`). Days are Dhaka calendar days, as the API counts them.
 */
export const ANALYTICS_PRESETS = [
  { value: "today", label: "Today", days: 1 },
  { value: "7d", label: "7 d", days: 7 },
  { value: "30d", label: "30 d", days: 30 },
  { value: "90d", label: "90 d", days: 90 },
  { value: "12m", label: "12 m", days: 365 },
] as const;

export type AnalyticsPreset = (typeof ANALYTICS_PRESETS)[number]["value"] | "custom";

export const CHANNELS = [
  { value: "WEB", label: "Web" },
  { value: "ASSISTANT", label: "Assistant" },
  { value: "WALK_IN", label: "Walk-in" },
] as const;

export type AnalyticsFilters = AnalyticsQuery & { range: AnalyticsPreset };

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export const dhakaDay = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(date);

/** The API caps a report at 400 days. */
const MAX_DAYS = 400;

export function parseAnalyticsFilters(params: Params): AnalyticsFilters {
  const today = dhakaDay(new Date());
  const rawRange = first(params.range);
  const compare = first(params.compare) === "none" ? "none" : "prev";
  const includeTest = first(params.test) === "1";
  const area = first(params.area)?.trim() || undefined;
  const rawChannel = first(params.channel);
  const channel = CHANNELS.some((c) => c.value === rawChannel) ? rawChannel : undefined;

  const from = first(params.from);
  const to = first(params.to);
  if (rawRange === "custom" && from && DAY.test(from)) {
    const end = to && DAY.test(to) && to >= from && to <= today ? to : today;
    const span = Math.round((Date.parse(end) - Date.parse(from)) / DAY_MS) + 1;
    const start = span > MAX_DAYS ? dhakaDay(new Date(Date.parse(end) - (MAX_DAYS - 1) * DAY_MS)) : from;
    return { range: "custom", from: start <= end ? start : end, to: end, compare, area, channel, includeTest };
  }

  const preset = ANALYTICS_PRESETS.find((p) => p.value === rawRange) ?? ANALYTICS_PRESETS[2];
  return {
    range: preset.value,
    from: dhakaDay(new Date(Date.now() - (preset.days - 1) * DAY_MS)),
    to: today,
    compare,
    area,
    channel,
    includeTest,
  };
}

/** The API query for a filter set (no `range`). */
export const toApiQuery = (f: AnalyticsFilters): AnalyticsQuery => ({
  from: f.from,
  to: f.to,
  compare: f.compare,
  area: f.area,
  channel: f.channel,
  includeTest: f.includeTest,
});

/** `from=…&to=…&compare=…` for the CSV links, mirroring the API's own params. */
export function exportQuery(f: AnalyticsFilters) {
  const q = new URLSearchParams({ from: f.from, to: f.to, compare: f.compare });
  if (f.area) q.set("area", f.area);
  if (f.channel) q.set("channel", f.channel);
  if (f.includeTest) q.set("includeTest", "1");
  return q.toString();
}

/** The period just before `from…to`, of the same length (as the API compares). */
export function previousRange(from: string, to: string) {
  const days = Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { from: iso(Date.parse(from) - days * DAY_MS), to: iso(Date.parse(from) - DAY_MS) };
}

/** `/api/admin/export/analytics/<report>.csv?…` for a report under these filters. */
export const csvHref = (report: string, f: AnalyticsFilters) =>
  `/api/admin/export/analytics/${report}.csv?${exportQuery(f)}`;
