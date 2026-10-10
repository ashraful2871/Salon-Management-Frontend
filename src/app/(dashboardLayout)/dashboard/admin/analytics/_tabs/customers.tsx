import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { CohortHeatmap } from "@/components/Admin/analytics/charts/HtmlCharts";
import { csvHref, toApiQuery } from "@/components/Admin/analytics/filters";
import { formatDayFull, formatMetric, isEmptySeries } from "@/components/Admin/analytics/format";
import { getAnalyticsReport } from "@/services/admin/analytics/getAnalyticsReport";
import type { CohortRow, SeriesPoint } from "@/services/admin/analytics/types";
import { breakdownTable } from "./bookings";
import { KpiGrid, NoData, NotTracked, ReportError, SeriesCard, UpdatedNote, type TabProps } from "./shared";
import { VolumeBars } from "../_charts";

const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const monthLabel = (ym: string) => monthFmt.format(new Date(`${ym}-01T00:00:00Z`));

/** Daily points → weeks starting on the first day of the range (partial last week kept). */
function weekly(points: SeriesPoint[] = []): SeriesPoint[] {
  const weeks: SeriesPoint[] = [];
  points.forEach((p, i) => {
    if (i % 7 === 0) weeks.push({ day: p.day, value: null });
    const w = weeks[weeks.length - 1];
    if (p.value !== null) w.value = (w.value ?? 0) + p.value;
  });
  return weeks;
}

export async function CustomersTab({ filters, defs, nowMs }: TabProps & { nowMs: number }) {
  const res = await getAnalyticsReport("customers", toApiQuery(filters));
  if (!res.success || !res.data) return <ReportError message={res.message} />;
  const r = res.data;
  const csv = csvHref("customers", filters);
  const weeks = weekly(r.series["customers.new"]);
  const cohorts: CohortRow[] = r.tables.cohorts ?? [];

  return (
    <div className="space-y-4">
      <UpdatedNote at={r.fetchedAt} nowMs={nowMs} />
      <KpiGrid
        report={r}
        defs={defs}
        ids={["customers.new", "customers.repeatRate", "signups", "signups.verifiedShare"]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="New customers per week"
          definition={defs["customers.new"]}
          note="Returning customers per week aren't split out yet; the repeat rate tile covers the range."
          csvHref={csv}
          chart={
            isEmptySeries(weeks) ? undefined : (
              <VolumeBars label="New customers" points={weeks} period="week" />
            )
          }
          table={
            isEmptySeries(weeks) ? (
              <NoData id="customers.new" series={r.series["customers.new"]} />
            ) : (
              <DataTable<SeriesPoint>
                caption="New customers per week"
                rows={weeks}
                rowKey={(w) => w.day}
                columns={[
                  { key: "w", label: "Week of", render: (w) => formatDayFull(w.day) },
                  { key: "n", label: "New customers", numeric: true, render: (w) => formatMetric(w.value, "count") },
                ]}
              />
            )
          }
        />
        <SeriesCard title="Sign-ups per day" id="signups" kind="bars" report={r} reportName="customers" filters={filters} defs={defs} />
      </div>

      <ChartCard
        title="Cohort retention"
        definition={defs["cohorts"]}
        csvHref={csv}
        table={
          cohorts.length ? (
            <CohortHeatmap
              caption="Monthly cohort retention: % of each first-booking month back in later months"
              rowHeader="First booking"
              columns={["+1 mo", "+2 mo", "+3 mo", "+4 mo", "+5 mo", "+6 mo"]}
              rows={cohorts.map((c) => ({
                key: c.cohort,
                label: monthLabel(c.cohort),
                sub: `n=${formatMetric(c.size, "count")}`,
                cells: c.months,
              }))}
            />
          ) : (
            <NoData id="cohorts" title="No cohorts in this range" />
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Sign-ups by role"
          definition={defs["signups"]}
          csvHref={csv}
          table={breakdownTable("Sign-ups by role", r.tables.signupsByRole ?? [], {}, "Role")}
        />
        <NotTracked
          title="Wallet adoption"
          what="The share of customers with a funded wallet isn't rolled up yet. Wallet float is on the Overview tab."
        />
      </div>
    </div>
  );
}
