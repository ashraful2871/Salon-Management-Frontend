import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { RankBars } from "@/components/Admin/analytics/charts/HtmlCharts";
import { csvHref, toApiQuery } from "@/components/Admin/analytics/filters";
import { humanize } from "@/components/Admin/analytics/format";
import { getAnalyticsReport } from "@/services/admin/analytics/getAnalyticsReport";
import { breakdownTable } from "./bookings";
import { KpiGrid, NotTracked, ReportError, SeriesCard, UpdatedNote, type TabProps } from "./shared";

export async function TryOnTab({ filters, defs, nowMs }: TabProps & { nowMs: number }) {
  const res = await getAnalyticsReport("tryon", toApiQuery(filters));
  if (!res.success || !res.data) return <ReportError message={res.message} />;
  const r = res.data;
  const failures = r.tables.failures ?? [];
  const done = r.series["tryon.done"];

  return (
    <div className="space-y-4">
      <UpdatedNote at={r.fetchedAt} nowMs={nowMs} />
      <KpiGrid report={r} defs={defs} ids={["tryon.uploads", "tryon.done", "tryon.failed", "tryon.latencyP50"]} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SeriesCard title="Uploads per day" id="tryon.uploads" kind="bars" report={r} reportName="tryon" filters={filters} defs={defs} />
        <SeriesCard
          title="Failed vs done"
          id="tryon.failed"
          report={r}
          reportName="tryon"
          filters={filters}
          defs={defs}
          comparison={done ? { label: "Done", points: done } : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Failures by code"
          definition={defs["tryon.failed"]}
          csvHref={csvHref("tryon", filters)}
          chart={
            failures.length ? (
              <RankBars
                label="Try-on failures by code"
                unit="count"
                rows={failures.map((f) => ({ key: f.key, label: humanize(f.key), value: f.value }))}
              />
            ) : undefined
          }
          table={breakdownTable("Try-on failures by code", failures, {}, "Code")}
        />
        <NotTracked title="Daily-cap hits" what="Requests refused by the daily generation cap aren't counted yet." />
      </div>
    </div>
  );
}
