import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { CHANNEL_LABELS, RankBars, StackedShare } from "@/components/Admin/analytics/charts/HtmlCharts";
import { csvHref, toApiQuery } from "@/components/Admin/analytics/filters";
import { formatDayFull, formatMetric, humanize, isEmptySeries } from "@/components/Admin/analytics/format";
import { getAnalyticsReport } from "@/services/admin/analytics/getAnalyticsReport";
import type { Breakdown } from "@/services/admin/analytics/types";
import { KpiGrid, NoData, NotTracked, ReportError, SeriesCard, UpdatedNote, type TabProps } from "./shared";
import { TrendLine } from "../_charts";

const PARTY: Record<string, string> = {
  CUSTOMER: "Customer",
  SALON: "Salon",
  ADMIN: "Admin",
  SYSTEM: "System",
  unknown: "Unknown (before tracking)",
};

export function breakdownTable(caption: string, rows: Breakdown, labels: Record<string, string> = {}, keyLabel = "Type") {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <DataTable<Breakdown[number]>
      caption={caption}
      rows={rows}
      rowKey={(r) => r.key}
      columns={[
        { key: "k", label: keyLabel, render: (r) => labels[r.key] ?? humanize(r.key) },
        { key: "n", label: "Count", numeric: true, render: (r) => formatMetric(r.value, "count") },
        {
          key: "s",
          label: "Share",
          numeric: true,
          render: (r) => (total ? formatMetric((r.value / total) * 100, "percent") : "—"),
        },
      ]}
    />
  );
}

export async function BookingsTab({ filters, defs, nowMs }: TabProps & { nowMs: number }) {
  const res = await getAnalyticsReport("bookings", toApiQuery(filters));
  if (!res.success || !res.data) return <ReportError message={res.message} />;
  const r = res.data;
  const csv = csvHref("bookings", filters);
  const created = r.series["bookings.created"];
  const completed = r.series["bookings.completed"];
  const byChannel = r.tables.byChannel ?? [];
  const cancelledBy = r.tables.cancelledBy ?? [];

  return (
    <div className="space-y-4">
      <UpdatedNote at={r.fetchedAt} nowMs={nowMs} />
      <KpiGrid
        report={r}
        defs={defs}
        ids={[
          "bookings.created",
          "bookings.completed",
          "ticket.avgMinor",
          "cancel.rate",
          "noshow.rate",
          "leadTime.medianDays",
          "slots.fillRate",
        ]}
      />

      {isEmptySeries(completed) ? (
        <ChartCard title="Completed vs created" table={<NoData id="bookings.completed" series={completed} />} />
      ) : (
        <ChartCard
          title="Completed vs created"
          definition={`${defs["bookings.completed"] ?? ""} Grey: ${defs["bookings.created"] ?? "bookings created that day."}`.trim()}
          csvHref={csv}
          chart={
            <TrendLine
              label="Completed"
              points={completed}
              unit="count"
              comparison={created ? { label: "Created", points: created } : undefined}
            />
          }
          table={
            <DataTable
              caption="Bookings completed and created per day"
              rows={completed.map((p, i) => ({ ...p, created: created?.[i]?.value ?? null }))}
              rowKey={(p) => p.day}
              columns={[
                { key: "d", label: "Day", render: (p) => formatDayFull(p.day) },
                { key: "c", label: "Completed", numeric: true, render: (p) => formatMetric(p.value, "count") },
                { key: "n", label: "Created", numeric: true, render: (p) => formatMetric(p.created, "count") },
              ]}
            />
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Channel mix"
          definition="Bookings created in the range, by where they were made."
          csvHref={csv}
          chart={byChannel.length ? <StackedShare label="Bookings by channel" parts={byChannel} /> : undefined}
          table={breakdownTable("Bookings by channel", byChannel, CHANNEL_LABELS, "Channel")}
        />
        <ChartCard
          title="Cancellations by party"
          definition={defs["bookings.cancelled"] ?? "Bookings cancelled in the range, by who cancelled."}
          csvHref={csv}
          chart={
            cancelledBy.length ? (
              <RankBars
                label="Cancellations by party"
                unit="count"
                rows={cancelledBy.map((c) => ({ key: c.key, label: PARTY[c.key] ?? humanize(c.key), value: c.value }))}
              />
            ) : undefined
          }
          table={breakdownTable("Cancellations by party", cancelledBy, PARTY, "Cancelled by")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SeriesCard title="No-show rate" id="noshow.rate" report={r} reportName="bookings" filters={filters} defs={defs} />
        <SeriesCard title="Cancellation rate" id="cancel.rate" report={r} reportName="bookings" filters={filters} defs={defs} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NotTracked
          title="Lead-time distribution"
          what="Only the median lead time is collected so far (the tile above). A per-booking distribution needs a new rollup."
        />
        <NotTracked
          title="Busiest weekday × hour"
          what="Bookings aren't rolled up by weekday and hour yet. This needs a new rollup."
        />
      </div>
    </div>
  );
}
