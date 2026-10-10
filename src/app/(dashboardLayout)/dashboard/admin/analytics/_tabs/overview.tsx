import Link from "next/link";
import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { FunnelBars, RankBars } from "@/components/Admin/analytics/charts/HtmlCharts";
import {
  csvHref,
  previousRange,
  toApiQuery,
  type AnalyticsFilters,
} from "@/components/Admin/analytics/filters";
import { dataStartsText, formatMetric, formatRange, kpiById } from "@/components/Admin/analytics/format";
import { getAnalyticsReport } from "@/services/admin/analytics/getAnalyticsReport";
import type { AnalyticsReport, AreaRow, FunnelStep, SalonMoneyRow } from "@/services/admin/analytics/types";
import {
  HeroFigure,
  KpiGrid,
  ReportError,
  SeriesCard,
  UpdatedNote,
  type Defs,
  type TabProps,
} from "./shared";

/**
 * Everything the Overview tab and Home draw from: the overview report, the
 * previous period's series (for the grey comparison line), plus the funnel,
 * areas, salons (top salons, active salons) and bookings (no-show rate).
 */
export async function loadOverview(filters: AnalyticsFilters) {
  const q = toApiQuery(filters);
  const prev = previousRange(filters.from, filters.to);
  const [overview, previous, funnel, geo, salons, bookings] = await Promise.all([
    getAnalyticsReport("overview", q),
    filters.compare === "prev"
      ? getAnalyticsReport("overview", { ...q, ...prev, compare: "none" })
      : Promise.resolve(null),
    getAnalyticsReport("funnel", q),
    getAnalyticsReport("geo", q),
    getAnalyticsReport("salons", q),
    getAnalyticsReport("bookings", q),
  ]);
  const ok = (r: typeof overview | null) => (r?.success ? (r.data ?? null) : null);
  return {
    error: overview.success ? null : overview.message,
    overview: ok(overview),
    previous: ok(previous),
    funnel: ok(funnel),
    geo: ok(geo),
    salons: ok(salons),
    bookings: ok(bookings),
  };
}

type Loaded = Awaited<ReturnType<typeof loadOverview>>;

export function BookingsPerDay({
  data,
  filters,
  defs,
}: {
  data: Loaded;
  filters: AnalyticsFilters;
  defs: Defs;
}) {
  const overview = data.overview;
  if (!overview) return null;
  const prevPoints = data.previous?.series["bookings.created"];
  return (
    <SeriesCard
      title="Bookings per day"
      id="bookings.created"
      report={overview}
      reportName="overview"
      filters={filters}
      defs={defs}
      comparison={prevPoints ? { label: "Previous period", points: prevPoints, showDay: true } : undefined}
    />
  );
}

export function FunnelCard({ funnel, filters, defs }: { funnel: AnalyticsReport | null; filters: AnalyticsFilters; defs: Defs }) {
  const steps: FunnelStep[] = funnel?.tables.steps ?? [];
  const has = steps.some((s) => s.value > 0);
  return (
    <ChartCard
      title="Discovery funnel"
      definition={`Visitors moving from a page view to a web booking. ${defs["funnel.page_view"] ?? ""}`.trim()}
      csvHref={csvHref("funnel", filters)}
      chart={has ? <FunnelBars label="Discovery funnel" steps={steps.map((s) => ({ ...s, key: s.id }))} /> : undefined}
      table={
        <DataTable<FunnelStep>
          caption="Discovery funnel"
          rows={has ? steps : []}
          rowKey={(s) => s.id}
          empty={dataStartsText("funnel.page_view")}
          columns={[
            { key: "step", label: "Step", render: (s) => s.label },
            { key: "n", label: "Count", numeric: true, render: (s) => formatMetric(s.value, "count") },
            {
              key: "prev",
              label: "% of previous step",
              numeric: true,
              render: (s) => (s.fromPrevious === null ? "—" : formatMetric(s.fromPrevious, "percent")),
            },
          ]}
        />
      }
    />
  );
}

export function TopAreasCard({ geo, filters, defs }: { geo: AnalyticsReport | null; filters: AnalyticsFilters; defs: Defs }) {
  const areas: AreaRow[] = geo?.tables.areas ?? [];
  const rows = areas.filter((a) => a.gmvMinor > 0);
  return (
    <ChartCard
      title="Top areas"
      definition={defs["geo.areas"]}
      note="By completed booking value"
      csvHref={csvHref("geo", filters)}
      chart={
        rows.length ? (
          <RankBars
            label="Top areas by completed booking value"
            unit="minor"
            rows={rows.map((a) => ({ key: a.area, label: a.area, sub: a.district || undefined, value: a.gmvMinor }))}
          />
        ) : undefined
      }
      table={
        <DataTable<AreaRow>
          caption="Areas"
          rows={areas.slice(0, 20)}
          rowKey={(a) => a.area}
          columns={[
            { key: "area", label: "Area", render: (a) => a.area },
            { key: "gmv", label: "Completed value", numeric: true, render: (a) => formatMetric(a.gmvMinor, "minor") },
            { key: "completed", label: "Completed", numeric: true, render: (a) => formatMetric(a.completed, "count") },
            { key: "created", label: "Created", numeric: true, render: (a) => formatMetric(a.created, "count") },
            { key: "listed", label: "Salons listed", numeric: true, render: (a) => formatMetric(a.listed, "count") },
          ]}
        />
      }
    />
  );
}

export function TopSalonsTable({ salons, filters }: { salons: AnalyticsReport | null; filters: AnalyticsFilters }) {
  const rows: SalonMoneyRow[] = salons?.tables.topSalons ?? [];
  return (
    <ChartCard
      title="Top salons"
      definition="Salons by completed booking value in the range (completion day, Asia/Dhaka)."
      csvHref={csvHref("salons", filters)}
      table={
        <DataTable<SalonMoneyRow>
          caption="Top salons by completed booking value"
          rows={rows}
          rowKey={(s) => s.salonId}
          columns={[
            {
              key: "name",
              label: "Salon",
              render: (s) => (
                <Link href={`/dashboard/admin/salons/${s.salonId}`} className="font-medium hover:underline">
                  {s.name}
                </Link>
              ),
            },
            { key: "area", label: "Area", render: (s) => s.area },
            { key: "gmv", label: "Completed value", numeric: true, render: (s) => formatMetric(s.gmvMinor, "minor") },
            { key: "n", label: "Completed", numeric: true, render: (s) => formatMetric(s.completed, "count") },
          ]}
        />
      }
    />
  );
}

export async function OverviewTab({ filters, defs, nowMs }: TabProps & { nowMs: number }) {
  const data = await loadOverview(filters);
  const o = data.overview;
  if (!o) return <ReportError message={data.error ?? "No data."} />;

  return (
    <div className="space-y-4">
      <UpdatedNote at={o.fetchedAt} nowMs={nowMs} />
      <HeroFigure
        kpi={kpiById(o.kpis, "gmv.completedMinor")}
        series={o.series["gmv.completedMinor"]}
        defs={defs}
        rangeText={formatRange(o.range.from, o.range.to)}
      />
      <KpiGrid
        report={o}
        defs={defs}
        ids={[
          "commission.minor",
          "takeRate",
          "bookings.completed",
          "customers.new",
          data.salons ? kpiById(data.salons.kpis, "salons.active30d") : undefined,
          "cancel.rate",
          data.bookings ? kpiById(data.bookings.kpis, "noshow.rate") : undefined,
          "wallet.floatMinor",
        ]}
        sparks={{ "commission.minor": o.series["commission.minor"], "bookings.completed": o.series["bookings.completed"] }}
      />
      <BookingsPerDay data={data} filters={filters} defs={defs} />
      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelCard funnel={data.funnel} filters={filters} defs={defs} />
        <TopAreasCard geo={data.geo} filters={filters} defs={defs} />
      </div>
      <TopSalonsTable salons={data.salons} filters={filters} />
    </div>
  );
}
