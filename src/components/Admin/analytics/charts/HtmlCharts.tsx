import Link from "next/link";
import type { MetricUnit } from "@/services/admin/analytics/types";
import { formatMetric, humanize } from "../format";

/*
 * The bar-style charts that need no plotting library: plain HTML, so they
 * render on the server, print their numbers next to the marks (no hover
 * needed to read them) and cost no JavaScript.
 */

const pct = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 1 });

export type RankRow = { key: string; label: string; value: number; sub?: string; href?: string };

/** Areas, salons: sorted horizontal bars, the value printed just past the bar's end. */
export function RankBars({
  rows,
  unit,
  limit = 10,
  label,
}: {
  rows: RankRow[];
  unit: MetricUnit;
  limit?: number;
  label: string;
}) {
  const top = [...rows].sort((a, b) => b.value - a.value).slice(0, limit);
  const max = Math.max(...top.map((r) => r.value), 0);
  if (top.length === 0 || max === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nothing in this range.</p>;
  }
  return (
    <ol aria-label={label} className="min-w-[300px] space-y-1.5">
      {top.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,8.5rem)_1fr] items-center gap-3 text-sm">
          <span className="truncate" title={r.label}>
            {r.href ? (
              <Link href={r.href} className="hover:underline focus-visible:underline">
                {r.label}
              </Link>
            ) : (
              r.label
            )}
            {r.sub && <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="h-3 shrink-0 rounded-r-sm bg-chart-1"
              style={{ width: `${Math.max((r.value / max) * 75, 0.5)}%` }}
            />
            <span className="shrink-0 tabular-nums text-foreground">{formatMetric(r.value, unit)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export type FunnelRow = { key: string; label: string; value: number; fromPrevious: number | null };

/**
 * Each step's bar against the largest step (event counts can rise between
 * steps, e.g. one visit viewing the salon list twice), so no bar passes 100%.
 * Labelled "n · x% of previous step".
 */
export function FunnelBars({ steps, label }: { steps: FunnelRow[]; label: string }) {
  const max = Math.max(0, ...steps.map((s) => s.value));
  return (
    <ol aria-label={label} className="min-w-[300px] space-y-2.5">
      {steps.map((s, i) => (
        <li key={s.key} className="space-y-1 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span>{s.label}</span>
            <span className="tabular-nums text-muted-foreground">
              <span className="font-medium text-foreground">{formatMetric(s.value, "count")}</span>
              {i > 0 && (
                <>
                  {" · "}
                  {s.fromPrevious === null ? "—" : `${pct.format(s.fromPrevious)}%`} of previous step
                </>
              )}
            </span>
          </div>
          <div aria-hidden className="h-3 rounded-sm bg-muted">
            <div
              className="h-3 rounded-sm bg-chart-1"
              style={{ width: `${max ? Math.max((s.value / max) * 100, s.value ? 0.5 : 0) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Fixed colour per channel, so a filter never repaints the survivors. */
export const ENTITY_COLOR: Record<string, string> = {
  WEB: "var(--chart-1)",
  ASSISTANT: "var(--chart-2)",
  WALK_IN: "var(--chart-3)",
};
const OTHER_COLOR = "var(--chart-4)";

export const CHANNEL_LABELS: Record<string, string> = {
  WEB: "Web",
  ASSISTANT: "Assistant",
  WALK_IN: "Walk-in",
};

/** Share of a whole, ≤ 4 parts (the rest fold into "Other"), 2 px surface gaps, a legend with numbers. */
export function StackedShare({
  parts,
  labels = CHANNEL_LABELS,
  colors = ENTITY_COLOR,
  label,
}: {
  parts: Array<{ key: string; value: number }>;
  labels?: Record<string, string>;
  /** Fixed colour per entity key (≤ 3; the rest fold into "Other"). */
  colors?: Record<string, string>;
  label: string;
}) {
  const sorted = [...parts].filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
  const known = sorted.filter((p) => colors[p.key]).slice(0, 3);
  const rest = sorted.filter((p) => !known.includes(p));
  const shown = [
    ...known.map((p) => ({ ...p, label: labels[p.key] ?? humanize(p.key), color: colors[p.key] })),
    ...(rest.length
      ? [{ key: "other", label: rest.length === 1 ? (labels[rest[0].key] ?? humanize(rest[0].key)) : "Other", value: rest.reduce((s, p) => s + p.value, 0), color: OTHER_COLOR }]
      : []),
  ];
  const total = shown.reduce((s, p) => s + p.value, 0);
  if (total === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Nothing in this range.</p>;

  return (
    <figure aria-label={label} className="min-w-[280px] space-y-3">
      <div aria-hidden className="flex h-4 gap-0.5 overflow-hidden rounded-sm">
        {shown.map((p) => (
          <span key={p.key} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {shown.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: p.color }} />
            <span>{p.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatMetric(p.value, "count")} · {pct.format((p.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** One-hue sequential fill: 0 → the surface, max → full --chart-3. */
const heat = (t: number) => `color-mix(in oklch, var(--chart-3) ${Math.round(8 + t * 82)}%, var(--surface))`;

/** An HTML table with a single-hue background per cell, the number in every cell, and a scale. */
export function CohortHeatmap({
  caption,
  rowHeader,
  columns,
  rows,
  unit = "percent",
}: {
  caption: string;
  rowHeader: string;
  columns: string[];
  rows: Array<{ key: string; label: string; sub?: string; cells: Array<number | null> }>;
  unit?: MetricUnit;
}) {
  const max = Math.max(0, ...rows.flatMap((r) => r.cells.map((c) => c ?? 0)));
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Nothing in this range.</p>;

  return (
    <div className="space-y-2">
      <table className="w-full min-w-max border-separate border-spacing-0.5 text-xs tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-muted-foreground">
            <th scope="col" className="px-2 py-1 text-left font-medium">
              {rowHeader}
            </th>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-2 py-1 text-right font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row" className="whitespace-nowrap px-2 py-1 text-left font-medium">
                {r.label}
                {r.sub && <span className="ml-1 font-normal text-muted-foreground">{r.sub}</span>}
              </th>
              {r.cells.map((v, i) => {
                const t = v === null || max === 0 ? 0 : v / max;
                return (
                  <td
                    key={i}
                    className={`rounded-sm px-2 py-1 text-right ${t > 0.55 ? "text-white" : "text-foreground"}`}
                    style={{ background: v === null ? "transparent" : heat(t) }}
                  >
                    {v === null ? <span className="text-muted-foreground">·</span> : formatMetric(v, unit)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">{formatMetric(0, unit)}</span>
        <span
          aria-hidden
          className="h-2 w-32 rounded-full"
          style={{ background: `linear-gradient(to right, ${heat(0)}, ${heat(1)})` }}
        />
        <span className="tabular-nums">{formatMetric(max, unit)}</span>
        <span>· “·” = not yet reached</span>
      </div>
    </div>
  );
}
