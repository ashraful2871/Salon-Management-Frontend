import { formatBDT } from "@/lib/money";
import type { KpiDelta } from "@/components/Admin/KpiTile";
import type { AnalyticsKpi, MetricUnit, SeriesPoint } from "@/services/admin/analytics/types";

const count = new Intl.NumberFormat("en-BD");
const decimal = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 1 });

/** A metric value in its unit; "—" when there is nothing to show. */
export function formatMetric(value: number | null | undefined, unit: MetricUnit): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  switch (unit) {
    case "minor":
      return formatBDT(Math.round(value));
    case "percent":
      return `${decimal.format(value)}%`;
    case "hours":
      return `${decimal.format(value)} h`;
    case "days":
      return `${decimal.format(value)} d`;
    default:
      return count.format(value);
  }
}

/** Short axis ticks: ৳1.2k, 3.4k, 12%. */
export function formatTick(value: number, unit: MetricUnit): string {
  if (unit === "percent") return `${decimal.format(value)}%`;
  const n = unit === "minor" ? value / 100 : value;
  const short = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  return unit === "minor" ? `৳${short}` : short;
}

/**
 * The change against the previous period. Percentages move in points, other
 * units in % of the previous value. `good` follows the metric's direction, and
 * the tile always pairs the colour with an arrow and words.
 */
export function kpiDelta(kpi: AnalyticsKpi): KpiDelta | undefined {
  const { value, previous, unit, goodDirection } = kpi;
  if (value === null || previous === undefined || previous === null) return undefined;
  const diff = value - previous;
  const direction = Math.abs(diff) < 1e-9 ? "flat" : diff > 0 ? "up" : "down";
  const good = direction === "flat" ? undefined : direction === goodDirection;
  if (unit === "percent") {
    return { text: `${diff > 0 ? "+" : ""}${decimal.format(diff)} pts`, direction, good };
  }
  if (previous === 0) {
    return { text: diff === 0 ? "0%" : `${diff > 0 ? "+" : ""}${formatMetric(diff, unit)}`, direction, good };
  }
  const pct = (diff / Math.abs(previous)) * 100;
  return { text: `${pct > 0 ? "+" : ""}${decimal.format(pct)}%`, direction, good };
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short" });
const dayFullFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "YYYY-MM-DD" (a Dhaka day) → "18 Sep"; noon UTC keeps it on the same day. */
export const formatDay = (day: string) => dayFmt.format(new Date(`${day}T12:00:00Z`));
export const formatDayFull = (day: string) => dayFullFmt.format(new Date(`${day}T12:00:00Z`));

export const formatRange = (from: string, to: string) =>
  from === to ? formatDayFull(from) : `${formatDay(from)} – ${formatDayFull(to)}`;

/** Sparkline values (nulls as 0 would draw a false dip, so they're dropped). */
export const sparkOf = (series?: SeriesPoint[]) =>
  (series ?? []).flatMap((p) => (p.value === null ? [] : [p.value]));

/** A series with no value anywhere: the metric hasn't been collected for this range. */
export const isEmptySeries = (series?: SeriesPoint[]) =>
  !series || series.length === 0 || series.every((p) => p.value === null);

/** The first day a series has data, for "Data starts on …". */
export const firstDataDay = (series?: SeriesPoint[]) => series?.find((p) => p.value !== null)?.day;

export const kpiById = (kpis: AnalyticsKpi[], id: string) => kpis.find((k) => k.id === id);

/** "dim_value" keys from the API → words. */
export const humanize = (key: string) =>
  key ? key.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()) : "Unknown";

/**
 * When collection began (Phase 10). Daily metrics were backfilled 30 days;
 * snapshots exist from the first rollup, events and search terms from launch.
 */
const SNAPSHOT_START = "2026-10-09";
const EVENTS_START = "2026-10-10";
const SNAPSHOTS = new Set(["salons.listed", "salons.active30d", "wallet.floatMinor", "deposits.heldMinor", "payable.minor"]);
const EVENTS = /^(funnel\.|visitors\.|search\.|ai\.|events\.)/;

export function trackingStart(id: string): string | undefined {
  if (SNAPSHOTS.has(id)) return SNAPSHOT_START;
  if (EVENTS.test(id)) return EVENTS_START;
  return undefined;
}

/** "Data starts on …" for an empty or partly empty series. */
export function dataStartsText(id: string, series?: SeriesPoint[]): string {
  const first = firstDataDay(series);
  if (first) return `Data starts on ${formatDayFull(first)}.`;
  const start = trackingStart(id);
  return start
    ? `Tracking began on ${formatDayFull(start)}. Figures appear after the next hourly rollup covers your range.`
    : "Nothing has been recorded for this range yet. Figures appear after the next hourly rollup.";
}
