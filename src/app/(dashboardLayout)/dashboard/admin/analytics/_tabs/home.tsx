import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { FunnelBars, RankBars } from "@/components/Admin/analytics/charts/HtmlCharts";
import { csvHref, toApiQuery } from "@/components/Admin/analytics/filters";
import { formatDayFull, formatMetric, humanize } from "@/components/Admin/analytics/format";
import { getAnalyticsReport } from "@/services/admin/analytics/getAnalyticsReport";
import type { HomeOutcome, HomeSupplyRow } from "@/services/admin/analytics/types";
import { breakdownTable } from "./bookings";
import { KpiGrid, NoData, ReportError, SeriesCard, UpdatedNote, type TabProps } from "./shared";

const POLICY_LABELS: Record<string, string> = { FREE: "Free cancel", WINDOW: "Window", NON_REFUNDABLE: "Non-refundable" };
const SIDE_LABELS: Record<string, string> = {
  CUSTOMER: "Customer cancelled",
  CUSTOMER_NO_SHOW: "Customer no-show",
  SALON: "Salon cancelled",
  EXPERT_NO_SHOW: "Expert no-show",
  MISMATCH: "Stopped at the door: details didn't match",
  SAFETY: "Stopped at the door: safety",
  ADMIN: "Admin cancelled",
  SYSTEM: "System cancelled",
};

const dhakaDayOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date(iso));

export async function HomeServiceTab({ filters, defs, nowMs }: TabProps & { nowMs: number }) {
  const res = await getAnalyticsReport("home", toApiQuery(filters));
  if (!res.success || !res.data) return <ReportError message={res.message} />;
  const r = res.data;
  const steps = r.tables.steps ?? [];
  const gaps = r.tables.gaps ?? [];
  const supply = r.tables.supply ?? [];
  const policy = r.tables.policy;
  const outcomes = policy?.outcomes ?? [];
  const kept = outcomes.reduce((s, o) => s + o.feeMinor, 0);
  const refunded = outcomes.reduce((s, o) => s + o.refundedMinor, 0);
  const csv = csvHref("home", filters);

  return (
    <div className="space-y-4">
      <UpdatedNote at={r.fetchedAt} nowMs={nowMs} />
      <KpiGrid
        report={r}
        defs={defs}
        ids={["funnel.home_view", "funnel.home_booking_paid", "home.completed", "home.gmvMinor"]}
        labels={{ "funnel.home_view": "Home Service views", "funnel.home_booking_paid": "Advances paid" }}
      />

      <ChartCard
        title="Funnel"
        definition="Views, quotes, created and paid are the home_* events; completed comes from the bookings. Do Not Track visitors and bots aren't in the events, so a step can pass the one before it."
        csvHref={csv}
        chart={
          steps.some((s) => s.value > 0) ? (
            <FunnelBars label="Home Service funnel" steps={steps.map((s) => ({ ...s, key: s.id }))} />
          ) : undefined
        }
        table={
          <DataTable<(typeof steps)[number]>
            caption="Home Service funnel"
            rows={steps}
            rowKey={(s) => s.id}
            columns={[
              { key: "l", label: "Step", render: (s) => s.label },
              { key: "v", label: "All", numeric: true, render: (s) => formatMetric(s.value, "count") },
              { key: "a", label: "Ladies", numeric: true, render: (s) => formatMetric(s.ladies ?? 0, "count") },
              { key: "b", label: "Gents", numeric: true, render: (s) => formatMetric(s.gents ?? 0, "count") },
              {
                key: "p",
                label: "Of previous step",
                numeric: true,
                render: (s) => (s.fromPrevious === null ? "—" : formatMetric(s.fromPrevious, "percent")),
              },
            ]}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SeriesCard title="Views per day" id="funnel.home_view" kind="bars" report={r} reportName="home" filters={filters} defs={defs} />
        <SeriesCard title="Visits completed per day" id="home.completed" kind="bars" report={r} reportName="home" filters={filters} defs={defs} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Coverage gaps"
          definition={defs["home.outOfArea"]}
          chart={
            gaps.length ? (
              <RankBars
                label="Out-of-area looks by nearest area"
                unit="count"
                rows={gaps.map((g) => ({ key: g.key, label: g.key, value: g.value }))}
              />
            ) : undefined
          }
          table={
            gaps.length ? (
              breakdownTable("Out-of-area looks by nearest area", gaps, {}, "Nearest area")
            ) : (
              <NoData id="home.outOfArea" title="No out-of-area looks in this range" />
            )
          }
        />
        <ChartCard
          title="Expert supply by area"
          definition={defs["home.supply"]}
          table={
            <DataTable<HomeSupplyRow>
              caption="Expert supply by area"
              rows={supply}
              rowKey={(s) => s.area}
              empty="No expert has been added yet."
              columns={[
                { key: "a", label: "Area", render: (s) => s.area },
                { key: "l", label: "Ladies", numeric: true, render: (s) => formatMetric(s.ladies, "count") },
                { key: "g", label: "Gents", numeric: true, render: (s) => formatMetric(s.gents, "count") },
                { key: "p", label: "Awaiting verification", numeric: true, render: (s) => formatMetric(s.pending, "count") },
              ]}
            />
          }
        />
      </div>

      <ChartCard
        title="Fees kept vs refunded"
        definition={defs["home.policyOutcomes"]}
        note={`${
          policy?.since ? `Booked since ${formatDayFull(dhakaDayOf(policy.since))}` : "Since launch: the policy has never been changed"
        } · kept ${formatMetric(kept, "minor")} · refunded ${formatMetric(refunded, "minor")}`}
        table={
          <DataTable<HomeOutcome>
            caption="Fees kept vs refunded"
            rows={outcomes}
            rowKey={(o) => `${o.side}|${o.policy}`}
            empty="No paid visit booked in this period ended without happening."
            columns={[
              { key: "s", label: "Ended by", render: (o) => SIDE_LABELS[o.side] ?? humanize(o.side) },
              { key: "p", label: "Policy", render: (o) => POLICY_LABELS[o.policy] ?? humanize(o.policy) },
              { key: "v", label: "Visits", numeric: true, render: (o) => formatMetric(o.visits, "count") },
              { key: "k", label: "Kept", numeric: true, render: (o) => formatMetric(o.feeMinor, "minor") },
              { key: "r", label: "Refunded", numeric: true, render: (o) => formatMetric(o.refundedMinor, "minor") },
            ]}
          />
        }
      />
    </div>
  );
}
