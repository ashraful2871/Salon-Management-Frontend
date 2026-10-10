import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChartNoAxesColumn } from "lucide-react";
import { KpiTile, Sparkline, type KpiDelta } from "@/components/Admin/KpiTile";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { csvHref, type AnalyticsFilters } from "@/components/Admin/analytics/filters";
import {
  dataStartsText,
  formatDayFull,
  formatMetric,
  isEmptySeries,
  kpiById,
  kpiDelta,
  sparkOf,
} from "@/components/Admin/analytics/format";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import type {
  AnalyticsKpi,
  AnalyticsReport,
  AnalyticsReportName,
  MetricUnit,
  SeriesPoint,
} from "@/services/admin/analytics/types";
import { TrendLine, VolumeBars } from "../_charts";

export type Defs = Record<string, string>;

export type TabProps = { filters: AnalyticsFilters; defs: Defs };

const FILTER_NOTE = "Area and channel filters don't narrow this metric, so it covers everything.";

const comparisonText = (k: AnalyticsKpi) =>
  k.filtersIgnored ? "vs previous period · unfiltered" : "vs previous period";

export const definitionOf = (defs: Defs, k: Pick<AnalyticsKpi, "id" | "filtersIgnored">) => {
  const base = defs[k.id];
  if (!k.filtersIgnored) return base;
  return base ? `${base} ${FILTER_NOTE}` : FILTER_NOTE;
};

/** Headline tiles for the given ids, in that order. Proportional figures, deltas with arrow + words. */
export function KpiGrid({
  report,
  ids,
  defs,
  labels = {},
  sparks = {},
  className,
}: {
  report: AnalyticsReport | null | undefined;
  ids: Array<string | AnalyticsKpi | undefined>;
  defs: Defs;
  labels?: Record<string, string>;
  sparks?: Record<string, SeriesPoint[] | undefined>;
  className?: string;
}) {
  const kpis = ids.flatMap((id) => {
    const k = typeof id === "string" ? (report ? kpiById(report.kpis, id) : undefined) : id;
    return k ? [k] : [];
  });
  if (kpis.length === 0) return null;
  return (
    <PendingRegion>
      <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
        {kpis.map((k) => (
          <KpiTile
            key={k.id}
            label={labels[k.id] ?? k.label}
            value={formatMetric(k.value, k.unit)}
            delta={kpiDelta(k)}
            comparison={comparisonText(k)}
            definition={definitionOf(defs, k)}
            spark={sparks[k.id] ? sparkOf(sparks[k.id]) : undefined}
          />
        ))}
      </div>
    </PendingRegion>
  );
}

function DeltaLine({ delta, comparison }: { delta: KpiDelta; comparison: string }) {
  const Arrow = delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : ArrowRight;
  const tone =
    delta.good === undefined ? TONE_CLASSES.neutral : delta.good ? TONE_CLASSES.success : TONE_CLASSES.danger;
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", tone.text)}>
        <Arrow aria-hidden className="size-4" />
        <span className="sr-only">
          {delta.direction === "up" ? "Up" : delta.direction === "down" ? "Down" : "No change"}
        </span>
        {delta.text}
      </span>
      <span className="text-muted-foreground">{comparison}</span>
    </p>
  );
}

/** The one big number: completed booking value, ≥ 48 px Inter, delta + sparkline. */
export function HeroFigure({
  kpi,
  series,
  defs,
  rangeText,
}: {
  kpi: AnalyticsKpi | undefined;
  series?: SeriesPoint[];
  defs: Defs;
  rangeText: string;
}) {
  if (!kpi) return null;
  const delta = kpiDelta(kpi);
  const spark = sparkOf(series);
  return (
    <PendingRegion>
      <section
        aria-label={kpi.label}
        className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-5"
      >
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground" title={definitionOf(defs, kpi)}>
            Completed booking value · {rangeText}
          </p>
          <p className="font-sans text-5xl font-semibold tracking-tight [font-variant-numeric:proportional-nums]">
            {formatMetric(kpi.value, kpi.unit)}
          </p>
          {delta && <DeltaLine delta={delta} comparison={comparisonText(kpi)} />}
        </div>
        {spark.length > 1 && (
          <Sparkline
            values={spark}
            className="h-14 w-full max-w-64 text-chart-1"
            label={`Daily completed booking value, ${spark.length} days`}
          />
        )}
      </section>
    </PendingRegion>
  );
}

/** "No data yet", saying when the data starts. Never a flat zero line. */
export function NoData({ id, series, title }: { id: string; series?: SeriesPoint[]; title?: string }) {
  return (
    <EmptyState icon={ChartNoAxesColumn} title={title ?? "No data yet"} description={dataStartsText(id, series)} />
  );
}

/** Not collected at all yet: say so plainly instead of drawing anything. */
export function NotTracked({ title, what }: { title: string; what: string }) {
  return (
    <ChartCard
      title={title}
      table={<EmptyState icon={ChartNoAxesColumn} title="Not tracked yet" description={what} />}
    />
  );
}

export function seriesTable(label: string, unit: MetricUnit, points: SeriesPoint[], other?: { label: string; points: SeriesPoint[] }) {
  type Row = { day: string; value: number | null; other?: number | null; otherDay?: string };
  const rows: Row[] = points.map((p, i) => ({
    day: p.day,
    value: p.value,
    other: other?.points[i]?.value ?? null,
    otherDay: other?.points[i]?.day,
  }));
  return (
    <DataTable<Row>
      caption={label}
      rows={rows}
      rowKey={(r) => r.day}
      columns={[
        { key: "day", label: "Day", render: (r) => formatDayFull(r.day) },
        { key: "value", label, numeric: true, render: (r) => formatMetric(r.value, unit) },
        ...(other
          ? [
              {
                key: "other",
                label: other.label,
                numeric: true,
                render: (r: Row) => formatMetric(r.other, unit),
              },
            ]
          : []),
      ]}
    />
  );
}

/**
 * One series as a card: a TrendLine (or VolumeBars) with its table twin and
 * the report's CSV, or "No data yet" when nothing has been collected.
 */
export function SeriesCard({
  title,
  id,
  report,
  reportName,
  filters,
  defs,
  kind = "line",
  unit,
  comparison,
}: {
  title: string;
  id: string;
  report: AnalyticsReport;
  reportName: AnalyticsReportName;
  filters: AnalyticsFilters;
  defs: Defs;
  kind?: "line" | "bars";
  unit?: MetricUnit;
  comparison?: { label: string; points: SeriesPoint[]; showDay?: boolean };
}) {
  const points = report.series[id];
  const metricUnit = unit ?? kpiById(report.kpis, id)?.unit ?? "count";
  const ignored = kpiById(report.kpis, id)?.filtersIgnored;
  const empty = isEmptySeries(points);
  const definition = definitionOf(defs, { id, filtersIgnored: ignored });

  if (empty) {
    return <ChartCard title={title} definition={definition} table={<NoData id={id} series={points} />} />;
  }
  return (
    <ChartCard
      title={title}
      definition={definition}
      csvHref={csvHref(reportName, filters)}
      note={firstGapNote(id, points)}
      chart={
        kind === "bars" ? (
          <VolumeBars label={title} points={points} unit={metricUnit} />
        ) : (
          <TrendLine label={title} points={points} unit={metricUnit} comparison={comparison} />
        )
      }
      table={seriesTable(title, metricUnit, points, comparison)}
    />
  );
}

/** A series whose first days are empty: tell when it starts rather than draw them as zeros. */
function firstGapNote(id: string, points: SeriesPoint[]): ReactNode {
  return points[0]?.value === null ? dataStartsText(id, points) : undefined;
}

export function ReportError({ message }: { message: string }) {
  return <ErrorState title="These figures couldn't be loaded" message={message} />;
}

/** "Updated n min ago" from the cached response's own time. */
export function UpdatedNote({ at, nowMs }: { at?: string; nowMs: number }) {
  if (!at) return null;
  const mins = Math.max(0, Math.floor((nowMs - Date.parse(at)) / 60_000));
  return (
    <p className="text-xs text-muted-foreground">
      Updated {mins === 0 ? "just now" : `${mins} min ago`} · refreshes every 5 min · Asia/Dhaka days
    </p>
  );
}
