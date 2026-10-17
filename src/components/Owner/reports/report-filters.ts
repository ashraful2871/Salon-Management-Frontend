import { presetRange } from "@/components/Money/money-format";
import { OWNER_REPORTS, type OwnerReportName } from "@/services/owner/report-types";

/**
 * Reports keep their whole state in the URL:
 * `?tab=bookings&range=30d&compare=1` (+ `from`/`to` when `range=custom`).
 * The branch is the switcher's cookie, like every other owner page.
 */
export const REPORT_PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 d" },
  { value: "30d", label: "30 d" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
] as const;

export type ReportPreset = (typeof REPORT_PRESETS)[number]["value"] | "custom";
export type ReportFilters = { tab: OwnerReportName; range: ReportPreset; from: string; to: string; compare: boolean };

export const REPORT_TABS: Array<{ key: OwnerReportName; label: string; ownerOnly?: boolean }> = [
  { key: "overview", label: "Overview" },
  { key: "bookings", label: "Bookings" },
  { key: "services", label: "Services" },
  { key: "team", label: "Team" },
  { key: "customers", label: "Customers" },
  { key: "utilisation", label: "Utilisation" },
  { key: "discovery", label: "Discovery" },
  { key: "money", label: "Money", ownerOnly: true },
];

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 366;
const DAY_MS = 86_400_000;

export const dhakaToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());

export function parseReportFilters(params: Params, canSeeMoney: boolean): ReportFilters {
  const rawTab = first(params.tab);
  const tab = (OWNER_REPORTS as readonly string[]).includes(rawTab ?? "") ? (rawTab as OwnerReportName) : "overview";
  const safeTab: OwnerReportName = tab === "money" && !canSeeMoney ? "overview" : tab;
  const compare = first(params.compare) === "1";
  const today = dhakaToday();

  const rawRange = first(params.range);
  const from = first(params.from);
  const to = first(params.to);
  if (rawRange === "custom" && from && DAY.test(from)) {
    const end = to && DAY.test(to) && to >= from && to <= today ? to : today;
    const span = Math.round((Date.parse(end) - Date.parse(from)) / DAY_MS) + 1;
    const start = span > MAX_DAYS ? new Date(Date.parse(end) - (MAX_DAYS - 1) * DAY_MS).toISOString().slice(0, 10) : from;
    return { tab: safeTab, range: "custom", from: start <= end ? start : end, to: end, compare };
  }
  const preset = REPORT_PRESETS.find((p) => p.value === rawRange)?.value ?? "30d";
  const span = preset === "today" ? { from: today, to: today } : presetRange(preset);
  return { tab: safeTab, range: preset, from: span.from ?? today, to: span.to ?? today, compare };
}

/** `/api/owner/export/reports/<tab>.csv?…` for the current filters. */
export const reportCsvHref = (f: ReportFilters, salonId?: string) => {
  const q = new URLSearchParams({ from: f.from, to: f.to });
  if (salonId) q.set("salonId", salonId);
  return `/api/owner/export/reports/${f.tab}.csv?${q}`;
};
