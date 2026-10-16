import Link from "next/link";
import { ChartNoAxesColumn, Plus } from "lucide-react";
import { KpiTile } from "@/components/Admin/KpiTile";
import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { FunnelBars, RankBars, StackedShare, type FunnelRow } from "@/components/Admin/analytics/charts/HtmlCharts";
import { formatDayFull, formatMetric, humanize, kpiDelta, sparkOf } from "@/components/Admin/analytics/format";
import { EmptyState } from "@/components/Shared/EmptyState";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { WeekHeatmap } from "@/components/Owner/reports/WeekHeatmap";
import type { ReportFilters } from "@/components/Owner/reports/report-filters";
import { cn } from "@/lib/utils";
import type { SeriesPoint } from "@/services/admin/analytics/types";
import type {
  BookingsReport,
  CustomersReport,
  DiscoveryReport,
  MoneyReport,
  OverviewReport,
  ReportKpi,
  ServicesReport,
  TeamReport,
  Unavailable,
  UtilisationReport,
} from "@/services/owner/report-types";
import { TrendLine, VolumeBars } from "./_charts";

export type TabProps<T> = { data: T; filters: ReportFilters; csv: string; compare: { from: string; to: string } | null };

const CHANNEL_LABELS: Record<string, string> = { WEB: "Web", ASSISTANT: "Assistant", WALK_IN: "Walk-in" };
const SOURCE_LABELS: Record<string, string> = { PLATFORM: "Found you on SalonKhuji", SALON_DIRECT: "Your own customers" };
const SOURCE_COLORS: Record<string, string> = { PLATFORM: "var(--chart-1)", SALON_DIRECT: "var(--chart-2)" };
const TYPE_LABELS: Record<string, string> = {
  booking: "Deposits applied",
  no_show: "No-show share",
  late_cancel: "Late-cancel fees",
  commission: "Commission",
  goodwill: "Goodwill credits",
  dues: "Dues paid",
  payout_adjustment: "Adjustments",
};

const dhakaDayOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date(iso));

const pts = <T extends { day: string }>(rows: T[], pick: (r: T) => number | null): SeriesPoint[] =>
  rows.map((r) => ({ day: r.day, value: pick(r) }));

function KpiRow({ kpis, sparks = {}, compare }: { kpis: ReportKpi[]; sparks?: Record<string, SeriesPoint[]>; compare: boolean }) {
  return (
    <PendingRegion>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiTile
            key={k.id}
            label={k.label}
            value={k.id === "rating" ? (k.value === null ? "—" : `${k.value} ★`) : formatMetric(k.value, k.unit)}
            delta={compare ? kpiDelta(k) : undefined}
            comparison={compare ? "vs previous period" : undefined}
            spark={sparks[k.id] ? sparkOf(sparks[k.id]) : undefined}
          />
        ))}
      </div>
    </PendingRegion>
  );
}

/** A figure we don't collect: said plainly, never drawn as zeros. */
function NotAvailable({ title, info }: { title: string; info: Unavailable }) {
  return (
    <ChartCard
      title={title}
      table={<EmptyState icon={ChartNoAxesColumn} title="Not available" description={info.reason} />}
    />
  );
}

function shareTable(rows: Array<{ key: string; value: number }>, labels: Record<string, string>, keyLabel: string) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <DataTable<{ key: string; value: number }>
      caption={keyLabel}
      rows={rows}
      rowKey={(r) => r.key}
      columns={[
        { key: "k", label: keyLabel, render: (r) => labels[r.key] ?? humanize(r.key) },
        { key: "n", label: "Bookings", numeric: true, render: (r) => formatMetric(r.value, "count") },
        { key: "s", label: "Share", numeric: true, render: (r) => (total ? formatMetric((r.value / total) * 100, "percent") : "—") },
      ]}
    />
  );
}

// ------------------------------------------------------------------ Overview

export function OverviewTab({ data, csv, compare }: TabProps<OverviewReport>) {
  const revenue = pts(data.series, (r) => r.revenue);
  const prev = data.previousSeries?.map((r) => ({ day: r.day, value: r.revenue }));
  return (
    <div className="space-y-4">
      <KpiRow
        kpis={data.kpis}
        compare={!!compare}
        sparks={{ revenue, bookings: pts(data.series, (r) => r.bookings), completed: pts(data.series, (r) => r.completed) }}
      />
      <ChartCard
        title="Revenue per day"
        definition="Counter takings (payments recorded at checkout, by the day the visit was completed) plus platform earnings (deposits applied, no-show and late-cancel shares). The same figures as Money → Statements."
        note={`Counter ${formatMetric(data.revenue.counterMinor, "minor")} · Platform ${formatMetric(data.revenue.platformMinor, "minor")}`}
        csvHref={csv}
        chart={
          <TrendLine
            label="Revenue"
            unit="minor"
            points={revenue}
            comparison={prev && compare ? { label: "Previous period", points: prev, showDay: true } : undefined}
          />
        }
        table={
          <DataTable<OverviewReport["series"][number]>
            caption="Revenue per day"
            rows={data.series}
            rowKey={(r) => r.day}
            columns={[
              { key: "d", label: "Day", render: (r) => formatDayFull(r.day) },
              { key: "b", label: "Bookings", numeric: true, render: (r) => formatMetric(r.bookings, "count") },
              { key: "c", label: "Completed", numeric: true, render: (r) => formatMetric(r.completed, "count") },
              { key: "ct", label: "Counter", numeric: true, render: (r) => formatMetric(r.counter, "minor") },
              { key: "p", label: "Platform", numeric: true, render: (r) => formatMetric(r.platform, "minor") },
              { key: "r", label: "Revenue", numeric: true, render: (r) => formatMetric(r.revenue, "minor") },
            ]}
          />
        }
      />
      <p className="text-xs text-muted-foreground">
        Bookings count every booking dated in the range, cancelled ones included ({data.cancelled} cancelled). Rating is
        the average of {data.reviews} published review{data.reviews === 1 ? "" : "s"} written in the range.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Bookings

export function BookingsTab({ data, csv }: TabProps<BookingsReport>) {
  return (
    <div className="space-y-4">
      <KpiRow kpis={data.kpis} compare={false} />
      <ChartCard
        title="When customers come"
        definition="Bookings (not cancelled) by weekday and start hour. Darker is busier."
        chart={<WeekHeatmap rows={data.heatmap.rows} grid={data.heatmap.grid} />}
        table={
          <DataTable<{ day: string; cells: number[] }>
            caption="Bookings by weekday and hour"
            rows={data.heatmap.rows.map((day, i) => ({ day, cells: data.heatmap.grid[i] }))}
            rowKey={(r) => r.day}
            columns={[
              { key: "d", label: "Day", render: (r) => r.day },
              ...Array.from({ length: 24 }, (_, h) => h)
                .filter((h) => data.heatmap.grid.some((row) => row[h] > 0))
                .map((h) => ({
                  key: String(h),
                  label: `${String(h).padStart(2, "0")}h`,
                  numeric: true,
                  render: (r: { cells: number[] }) => formatMetric(r.cells[h], "count"),
                })),
            ]}
          />
        }
      />
      <ChartCard
        title="Bookings per day"
        csvHref={csv}
        chart={<VolumeBars label="Bookings" points={pts(data.perDay, (r) => r.total)} />}
        table={
          <DataTable<BookingsReport["perDay"][number]>
            caption="Bookings per day by status"
            rows={data.perDay}
            rowKey={(r) => r.day}
            columns={[
              { key: "d", label: "Day", render: (r) => formatDayFull(r.day) },
              ...data.statuses.map((s) => ({
                key: s,
                label: humanize(s),
                numeric: true,
                render: (r: BookingsReport["perDay"][number]) => formatMetric(Number(r[s] ?? 0), "count"),
              })),
              { key: "t", label: "Total", numeric: true, render: (r) => formatMetric(r.total, "count") },
            ]}
          />
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="How far ahead people book"
          definition="Time from making the booking to its start. Walk-ins are under 2 h."
          chart={<RankBars label="Lead time" unit="count" rows={data.leadTime} limit={5} />}
          table={shareTable(data.leadTime.map((l) => ({ key: l.label, value: l.value })), {}, "Lead time")}
        />
        <ChartCard
          title="Where bookings come from"
          chart={<StackedShare label="Bookings by channel" parts={data.channels} labels={CHANNEL_LABELS} />}
          table={shareTable(data.channels, CHANNEL_LABELS, "Channel")}
        />
      </div>
      <ChartCard
        title="Why bookings were cancelled"
        definition="Top 10 reasons given, in the range."
        table={
          <DataTable<{ reason: string; n: number }>
            caption="Cancellation reasons"
            rows={data.cancellationReasons}
            rowKey={(r) => r.reason}
            empty="No cancellations in this range."
            columns={[
              { key: "r", label: "Reason", render: (r) => r.reason },
              { key: "n", label: "Cancelled", numeric: true, render: (r) => formatMetric(r.n, "count") },
            ]}
          />
        }
      />
    </div>
  );
}

// ------------------------------------------------------------------ Services

export function ServicesTab({ data, csv }: TabProps<ServicesReport>) {
  return (
    <div className="space-y-4">
      <ChartCard
        title="What earns"
        definition="Revenue = the booked price of completed visits. Services with the same name across branches are added together."
        csvHref={csv}
        chart={
          <RankBars
            label="Revenue by service"
            unit="minor"
            rows={data.rows.map((r) => ({ key: r.name, label: r.name, value: r.revenueMinor, sub: `${r.completed} done` }))}
          />
        }
        table={
          <DataTable<ServicesReport["rows"][number]>
            caption="Services"
            rows={data.rows}
            rowKey={(r) => r.name}
            columns={[
              { key: "n", label: "Service", render: (r) => r.name },
              { key: "c", label: "Category", render: (r) => humanize(r.category) },
              { key: "b", label: "Bookings", numeric: true, render: (r) => formatMetric(r.bookings, "count") },
              { key: "d", label: "Completed", numeric: true, render: (r) => formatMetric(r.completed, "count") },
              { key: "r", label: "Revenue", numeric: true, render: (r) => formatMetric(r.revenueMinor, "minor") },
              { key: "a", label: "Avg price", numeric: true, render: (r) => formatMetric(r.avgPriceMinor, "minor") },
              { key: "s", label: "Share", numeric: true, render: (r) => formatMetric(r.share, "percent") },
            ]}
          />
        }
      />
      <ChartCard
        title="Never booked in this range"
        note={data.neverBooked.length >= 200 ? "First 200 shown." : undefined}
        table={
          <DataTable<ServicesReport["neverBooked"][number]>
            caption="Services with no bookings"
            rows={data.neverBooked}
            rowKey={(r) => r.serviceId}
            empty="Every active service had a booking."
            columns={[
              { key: "n", label: "Service", render: (r) => r.name },
              { key: "b", label: "Branch", render: (r) => r.salonName },
              { key: "p", label: "Price", numeric: true, render: (r) => formatMetric(r.priceMinor, "minor") },
            ]}
          />
        }
      />
    </div>
  );
}

// ------------------------------------------------------------------ Team

export function TeamTab({ data, csv }: TabProps<TeamReport>) {
  const t = data.totals;
  const kpis: ReportKpi[] = [
    { id: "bookings", label: "Bookings", value: t.bookings, unit: "count", goodDirection: "up" },
    { id: "completed", label: "Completed", value: t.completed, unit: "count", goodDirection: "up" },
    { id: "revenue", label: "Revenue", value: t.revenueMinor, unit: "minor", goodDirection: "up" },
    {
      id: "utilisation",
      label: "Utilisation",
      value: t.utilisation === null ? null : Math.round(t.utilisation * 1000) / 10,
      unit: "percent",
      goodDirection: "up",
    },
  ];
  return (
    <div className="space-y-4">
      <KpiRow kpis={kpis} compare={false} />
      <ChartCard
        title="By stylist"
        definition="The same figures as Team → Performance: bookings not cancelled, revenue of completed visits, utilisation = booked minutes ÷ shift minutes."
        note={data.rowCount > data.rows.length ? `Top ${data.rows.length} of ${data.rowCount} by revenue.` : undefined}
        csvHref={csv}
        chart={
          <RankBars
            label="Revenue by stylist"
            unit="minor"
            rows={data.rows.map((r, i) => ({ key: `${r.staffId ?? "u"}-${r.salonId}-${i}`, label: r.name, value: r.revenueMinor, sub: r.salonName }))}
          />
        }
        table={
          <DataTable<TeamReport["rows"][number]>
            caption="Stylists"
            rows={data.rows}
            rowKey={(r, i) => `${r.staffId ?? "u"}-${r.salonId}-${i}`}
            columns={[
              { key: "n", label: "Stylist", render: (r) => r.name },
              { key: "b", label: "Branch", render: (r) => r.salonName },
              { key: "k", label: "Bookings", numeric: true, render: (r) => formatMetric(r.bookings, "count") },
              { key: "c", label: "Completed", numeric: true, render: (r) => formatMetric(r.completed, "count") },
              { key: "r", label: "Revenue", numeric: true, render: (r) => formatMetric(r.revenueMinor, "minor") },
              { key: "s", label: "Rating", numeric: true, render: (r) => (r.rating === null ? "—" : `${r.rating} ★`) },
              {
                key: "u",
                label: "Utilisation",
                numeric: true,
                render: (r) => (r.utilisation === null ? "—" : formatMetric(r.utilisation * 100, "percent")),
              },
            ]}
          />
        }
      />
    </div>
  );
}

// ------------------------------------------------------------------ Customers

export function CustomersTab({ data, csv }: TabProps<CustomersReport>) {
  const r60 = data.retention60;
  return (
    <div className="space-y-4">
      <PendingRegion>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.kpis.map((k) => (
            <KpiTile key={k.id} label={k.label} value={formatMetric(k.value, k.unit)} />
          ))}
          <KpiTile
            label="Came back within 60 days"
            value={r60.available ? formatMetric(r60.percent, "percent") : "—"}
            definition={
              r60.available
                ? `${r60.retained} of ${r60.cohort} customers whose first completed visit was between the start of the range and ${r60.cohortTo} came back within 60 days.`
                : r60.reason
            }
          />
        </div>
      </PendingRegion>
      <ChartCard
        title="New and returning, per week"
        definition="Each customer counted once per week they booked: new if that week holds their first booking at your salons."
        csvHref={csv}
        chart={<VolumeBars label="Returning customers" period="week" points={data.weekly.map((w) => ({ day: w.week, value: w.returning }))} />}
        table={
          <DataTable<CustomersReport["weekly"][number]>
            caption="Weekly customers"
            rows={data.weekly}
            rowKey={(r) => r.week}
            columns={[
              { key: "w", label: "Week of", render: (r) => formatDayFull(r.week) },
              { key: "n", label: "New", numeric: true, render: (r) => formatMetric(r.fresh, "count") },
              { key: "r", label: "Returning", numeric: true, render: (r) => formatMetric(r.returning, "count") },
            ]}
          />
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Top customers"
          definition="By what they spent on completed visits in the range."
          table={
            <DataTable<CustomersReport["top"][number]>
              caption="Top customers"
              rows={data.top}
              rowKey={(r) => r.customerId}
              columns={[
                {
                  key: "n",
                  label: "Customer",
                  render: (r) => (
                    <Link href={`/dashboard/customers/${r.customerId}`} className="text-primary hover:underline">
                      {r.name}
                    </Link>
                  ),
                },
                { key: "v", label: "Visits", numeric: true, render: (r) => formatMetric(r.visits, "count") },
                { key: "s", label: "Spent", numeric: true, render: (r) => formatMetric(r.spentMinor, "minor") },
              ]}
            />
          }
        />
        <ChartCard
          title="Lapsed (worth a call)"
          definition="Customers with at least one completed visit and no booking in the last 60 days, by lifetime spend. Top 50."
          table={
            <DataTable<CustomersReport["lapsed"][number]>
              caption="Lapsed customers"
              rows={data.lapsed}
              rowKey={(r) => r.customerId}
              empty="Nobody has lapsed."
              columns={[
                {
                  key: "n",
                  label: "Customer",
                  render: (r) => (
                    <Link href={`/dashboard/customers/${r.customerId}`} className="text-primary hover:underline">
                      {r.name}
                    </Link>
                  ),
                },
                { key: "l", label: "Last booking", render: (r) => (r.lastBooking ? formatDayFull(r.lastBooking) : "—") },
                { key: "s", label: "Spent", numeric: true, render: (r) => formatMetric(r.spentMinor, "minor") },
              ]}
            />
          }
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Utilisation

export function UtilisationTab({ data, csv }: TabProps<UtilisationReport>) {
  if (!data.available) return <NotAvailable title="Slot utilisation" info={data} />;
  const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return (
    <div className="space-y-4">
      <KpiRow kpis={data.kpis} compare={false} />
      <ChartCard
        title="Fill rate per day"
        definition="Booked slots ÷ slots offered (blocked and cancelled slots are not offered)."
        csvHref={csv}
        chart={<TrendLine label="Fill rate" unit="percent" points={pts(data.perDay, (r) => r.fill)} />}
        table={
          <DataTable<(typeof data.perDay)[number]>
            caption="Slots per day"
            rows={data.perDay}
            rowKey={(r) => r.day}
            columns={[
              { key: "d", label: "Day", render: (r) => formatDayFull(r.day) },
              { key: "o", label: "Offered", numeric: true, render: (r) => formatMetric(r.offered, "count") },
              { key: "b", label: "Booked", numeric: true, render: (r) => formatMetric(r.booked, "count") },
              { key: "f", label: "Fill", numeric: true, render: (r) => formatMetric(r.fill, "percent") },
            ]}
          />
        }
      />
      <ChartCard
        title="By hour of day"
        note={data.emptyHours.length ? `Never booked: ${data.emptyHours.map(hour).join(", ")}` : undefined}
        chart={
          <RankBars
            label="Fill rate by hour"
            unit="percent"
            limit={24}
            rows={data.perHour.map((h) => ({ key: String(h.hour), label: hour(h.hour), value: h.fill ?? 0, sub: `${h.booked}/${h.offered}` }))}
          />
        }
        table={
          <DataTable<{ hour: number; offered: number; booked: number; fill: number | null }>
            caption="Slots by hour"
            rows={data.perHour}
            rowKey={(r) => String(r.hour)}
            columns={[
              { key: "h", label: "Hour", render: (r) => hour(r.hour) },
              { key: "o", label: "Offered", numeric: true, render: (r) => formatMetric(r.offered, "count") },
              { key: "b", label: "Booked", numeric: true, render: (r) => formatMetric(r.booked, "count") },
              { key: "f", label: "Fill", numeric: true, render: (r) => formatMetric(r.fill, "percent") },
            ]}
          />
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="By counter"
          table={
            <DataTable<{ counterId: string | null; name: string; salonName: string; offered: number; booked: number; fill: number | null }>
              caption="Counters"
              rows={data.perCounter}
              rowKey={(r, i) => `${r.counterId ?? "none"}-${i}`}
              columns={[
                { key: "n", label: "Counter", render: (r) => r.name },
                { key: "s", label: "Branch", render: (r) => r.salonName },
                { key: "o", label: "Offered", numeric: true, render: (r) => formatMetric(r.offered, "count") },
                { key: "f", label: "Fill", numeric: true, render: (r) => formatMetric(r.fill, "percent") },
              ]}
            />
          }
        />
        <ChartCard
          title="By stylist"
          definition="Booked minutes ÷ shift minutes, least busy first."
          table={
            <DataTable<{ name: string; salonName: string; utilisation: number | null }>
              caption="Stylists"
              rows={data.staff}
              rowKey={(r, i) => `${r.name}-${i}`}
              empty="No stylist hours in this range."
              columns={[
                { key: "n", label: "Stylist", render: (r) => r.name },
                { key: "s", label: "Branch", render: (r) => r.salonName },
                { key: "u", label: "Utilisation", numeric: true, render: (r) => formatMetric(r.utilisation, "percent") },
              ]}
            />
          }
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Discovery

export function DiscoveryTab({ data, csv }: TabProps<DiscoveryReport>) {
  // Only measured steps go into the funnel; the rest are named below it.
  const measured = data.funnel.filter((s): s is DiscoveryReport["funnel"][number] & { available: true; value: number } => s.available);
  const steps: FunnelRow[] = measured.map((s, i) => ({
    key: s.key,
    label: s.label,
    value: s.value,
    fromPrevious: i > 0 && measured[i - 1].value > 0 ? Math.round((s.value / measured[i - 1].value) * 1000) / 10 : null,
  }));
  const missing = data.funnel.filter((s) => !s.available) as Array<{ label: string } & Unavailable>;
  const md = data.missedDemand;
  return (
    <div className="space-y-4">
      <ChartCard
        title="From search to booking"
        definition="How many people saw your profile, and how many booked online. Each step is what we can measure for your branches."
        chart={<FunnelBars label="Discovery funnel" steps={steps} />}
        table={
          <DataTable<{ key: string; label: string; value: number }>
            caption="Funnel"
            rows={measured}
            rowKey={(r) => r.key}
            columns={[
              { key: "l", label: "Step", render: (r) => r.label },
              { key: "v", label: "Count", numeric: true, render: (r) => formatMetric(r.value, "count") },
            ]}
          />
        }
        note={missing.length ? `Not measured yet: ${missing.map((m) => m.label.toLowerCase()).join(", ")}.` : undefined}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Who books"
          definition="Customers who found you through SalonKhuji, against your own customers (no commission on those)."
          chart={<StackedShare label="Bookings by source" parts={data.sources} labels={SOURCE_LABELS} colors={SOURCE_COLORS} />}
          table={shareTable(data.sources, SOURCE_LABELS, "Source")}
        />
        <NotAvailable title="AI Match appearances" info={data.aiMatch} />
      </div>
      {md.available ? (
        <ChartCard
          title="Missed demand"
          definition="What people searched for that none of your services answer. Adding one may bring those customers to you."
          note={md.note}
          csvHref={csv}
          table={
            <DataTable<{ term: string; searches: number; zero: number }>
              caption="Missed demand"
              rows={md.terms}
              rowKey={(r) => r.term}
              empty="Your services cover what people searched for."
              columns={[
                { key: "t", label: "Searched for", render: (r) => r.term },
                { key: "s", label: "Searches", numeric: true, render: (r) => formatMetric(r.searches, "count") },
                {
                  key: "a",
                  label: "",
                  render: () => (
                    <Link href="/dashboard/services" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Plus className="size-3.5" aria-hidden /> Add this service
                    </Link>
                  ),
                },
              ]}
            />
          }
        />
      ) : (
        <NotAvailable title="Missed demand" info={md} />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Money

export function MoneyTab({ data, csv }: TabProps<MoneyReport>) {
  return (
    <div className="space-y-4">
      <KpiRow kpis={data.kpis.slice(0, 4)} compare={false} />
      <ChartCard
        title="Money in per day"
        definition="Counter takings plus platform earnings, the same bases as your monthly statement."
        csvHref={csv}
        chart={<VolumeBars label="Money in" unit="minor" points={pts(data.series, (r) => r.counter + r.platform)} />}
        table={
          <DataTable<MoneyReport["series"][number]>
            caption="Money per day"
            rows={data.series}
            rowKey={(r) => r.day}
            columns={[
              { key: "d", label: "Day", render: (r) => formatDayFull(r.day) },
              { key: "c", label: "Counter", numeric: true, render: (r) => formatMetric(r.counter, "minor") },
              { key: "p", label: "Platform", numeric: true, render: (r) => formatMetric(r.platform, "minor") },
            ]}
          />
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Counter takings by method"
          table={
            <DataTable<MoneyReport["counterByMethod"][number]>
              caption="Counter takings"
              rows={data.counterByMethod}
              rowKey={(r) => r.key}
              columns={[
                { key: "m", label: "Method", render: (r) => humanize(r.key) },
                { key: "n", label: "Payments", numeric: true, render: (r) => formatMetric(r.payments, "count") },
                { key: "v", label: "Amount", numeric: true, render: (r) => formatMetric(r.valueMinor, "minor") },
              ]}
            />
          }
        />
        <ChartCard
          title="Platform balance movements"
          definition="What moved your SalonKhuji balance, by type. Commission and goodwill are negative."
          table={
            <DataTable<MoneyReport["platformByType"][number]>
              caption="Balance movements"
              rows={data.platformByType}
              rowKey={(r) => r.key}
              columns={[
                { key: "t", label: "Type", render: (r) => TYPE_LABELS[r.key] ?? humanize(r.key) },
                {
                  key: "v",
                  label: "Amount",
                  numeric: true,
                  render: (r) => <span className={cn(r.valueMinor < 0 && "text-danger")}>{formatMetric(r.valueMinor, "minor")}</span>,
                },
              ]}
            />
          }
        />
      </div>
      <ChartCard
        title={`Payouts (${formatMetric(data.kpis.find((k) => k.id === "paidOut")?.value ?? 0, "minor")})`}
        table={
          <DataTable<MoneyReport["payouts"][number]>
            caption="Payouts paid in the range"
            rows={data.payouts}
            rowKey={(r) => r.payoutId}
            empty="No payouts were paid in this range."
            columns={[
              { key: "d", label: "Paid", render: (r) => formatDayFull(dhakaDayOf(r.paidAt)) },
              {
                key: "a",
                label: "Amount",
                numeric: true,
                render: (r) => (
                  <Link href={`/dashboard/money/payouts/${r.payoutId}`} className="text-primary hover:underline">
                    {formatMetric(r.amountMinor, "minor")}
                  </Link>
                ),
              },
            ]}
          />
        }
      />
    </div>
  );
}
