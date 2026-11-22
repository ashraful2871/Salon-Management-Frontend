import type { Metadata } from "next";
import Link from "next/link";
import { Download, SlidersHorizontal } from "lucide-react";
import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { FunnelBars } from "@/components/Admin/analytics/charts/HtmlCharts";
import { DataTable } from "@/components/Admin/analytics/DataTable";
import { DateRangeFilter } from "@/components/Admin/analytics/DateRangeFilter";
import { formatDayFull, formatMetric, formatRange, kpiDelta } from "@/components/Admin/analytics/format";
import { KpiTile } from "@/components/Admin/KpiTile";
import { parseReferralRange, previousOf, REFERRAL_PRESETS, referralCsvHref } from "@/components/Admin/referrals/filters";
import { KIND_LABELS } from "@/components/Admin/referrals/labels";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { can } from "@/lib/admin-permissions";
import { formatBDT } from "@/lib/money";
import { getAdminMe } from "@/services/admin/getAdminMe";
import type { AnalyticsKpi, MetricUnit } from "@/services/admin/analytics/types";
import { getReferralOverview } from "@/services/referral/getReferralOverview";
import type { AdminReferralOverview } from "@/services/referral/types";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";
import { LinesAndBars } from "../analytics/_charts";

export const metadata: Metadata = { title: "Referrals | Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Kpis = AdminReferralOverview["kpis"];

/** The eight headline tiles: what the program brings in and what it costs. */
const TILES: Array<{
  id: keyof Kpis;
  label: string;
  unit: MetricUnit;
  good: "up" | "down";
  definition: string;
}> = [
  { id: "attached", label: "New sign-ups via referral", unit: "count", good: "up", definition: "Accounts created with a referral code or link in the range." },
  { id: "joined", label: "Verified", unit: "count", good: "up", definition: "Referred friends who verified their email in the range." },
  { id: "qualified", label: "First bookings completed", unit: "count", good: "up", definition: "Referrals that qualified in the range: the friend's first completed platform booking within the window." },
  { id: "conversionPercent", label: "Conversion", unit: "percent", good: "up", definition: "Of the friends who verified in the range, the share who have qualified so far." },
  { id: "rewardsRedeemed", label: "Rewards redeemed", unit: "count", good: "up", definition: "Rewards spent on a completed booking in the range (a no-show using one up is not counted)." },
  { id: "discountCostMinor", label: "Referral cost", unit: "minor", good: "down", definition: "Platform-funded referral discounts on bookings completed in the range (the PLATFORM_PROMO ledger lines)." },
  { id: "costPerQualifiedMinor", label: "Cost per new customer", unit: "minor", good: "down", definition: "Referral cost divided by first bookings completed in the range." },
  { id: "referredGmvMinor", label: "Revenue from referred customers", unit: "minor", good: "up", definition: "GMV of every completed booking by referred customers in the range: salon total less the counter discount, home services subtotal." },
];

/**
 * Is the referral program working, and what does it cost? One filter row
 * (in the URL), eight tiles with the previous period's change, the funnel,
 * the daily chart and the top referrers. Figures come from the API only.
 */
export default async function ReferralOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const range = parseReferralRange(await searchParams);
  const prev = previousOf(range);
  const [current, previous, me, settings] = await Promise.all([
    getReferralOverview({ from: range.from, to: range.to, includeTest: range.includeTest || undefined }),
    getReferralOverview({ ...prev, includeTest: range.includeTest || undefined }),
    getAdminMe(),
    getPublicSettings(),
  ]);
  const permissions = me.data?.permissions ?? [];
  const data = current.success ? current.data : undefined;
  const before = previous.success ? previous.data : undefined;
  const program = referralSettingsOf(settings.success ? settings.data : null);
  const canExport = can(permissions, "analytics.export");
  const canSettings = can(permissions, "settings.view");
  const canUsers = can(permissions, "users.view");

  return (
    <FilterNavigationProvider>
      <div className="min-w-0 space-y-5">
        <PageHeader
          title="Referrals"
          description={`${formatRange(range.from, range.to)}${range.includeTest ? " · including test data" : ""} · Asia/Dhaka days`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {canExport && (
                <>
                  <CsvLink href={referralCsvHref("referrals", range)} label="Referrals CSV" />
                  <CsvLink href={referralCsvHref("rewards", range)} label="Rewards CSV" />
                </>
              )}
              {canSettings && (
                <Link
                  href="/dashboard/admin/referrals/settings"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <SlidersHorizontal aria-hidden className="size-4" /> Program settings
                </Link>
              )}
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="Program status">
          <ToneBadge status={program["referral.enabled"] ? "ON" : "OFF"} tone={program["referral.enabled"] ? "success" : "neutral"} dot>
            Program {program["referral.enabled"] ? "on" : "off"}
          </ToneBadge>
          <ToneBadge
            status={program["referral.redemptionsEnabled"] ? "ON" : "OFF"}
            tone={program["referral.redemptionsEnabled"] ? "success" : "warning"}
            dot
          >
            Redemptions {program["referral.redemptionsEnabled"] ? "on" : "off"}
          </ToneBadge>
          {data && data.kpis.pendingReview > 0 && can(permissions, "referrals.manage") && (
            <Link href="/dashboard/admin/referrals/review" className="text-primary underline-offset-4 hover:underline">
              {data.kpis.pendingReview} waiting for review
            </Link>
          )}
        </div>

        <DateRangeFilter filters={range} presets={REFERRAL_PRESETS} rangeAndTest label="Referral filters" />

        {!data ? (
          <ErrorState title="These figures couldn't be loaded" message={current.message} />
        ) : (
          <>
            <PendingRegion>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {TILES.map((t) => {
                  const kpi: AnalyticsKpi = {
                    id: t.id,
                    label: t.label,
                    value: data.kpis[t.id] as number,
                    previous: before ? (before.kpis[t.id] as number) : undefined,
                    unit: t.unit,
                    goodDirection: t.good,
                  };
                  return (
                    <KpiTile
                      key={t.id}
                      label={t.label}
                      value={formatMetric(kpi.value, t.unit)}
                      delta={kpiDelta(kpi)}
                      definition={t.definition}
                      spark={
                        t.id === "attached"
                          ? data.daily.map((d) => d.attached)
                          : t.id === "qualified"
                            ? data.daily.map((d) => d.qualified)
                            : t.id === "discountCostMinor"
                              ? data.daily.map((d) => d.costMinor)
                              : undefined
                      }
                    />
                  );
                })}
              </div>
            </PendingRegion>

            <div className="grid gap-4 xl:grid-cols-2">
              <Funnel data={data} />
              <ChartCard
                title="Cost by reward"
                definition="Platform-funded discount on completed bookings in the range, by the kind of reward used."
                table={
                  <DataTable
                    caption="Referral cost by reward kind"
                    rows={data.costByKind}
                    rowKey={(r) => r.kind}
                    empty="No referral discount was used in this range."
                    columns={[
                      { key: "kind", label: "Reward", render: (r) => KIND_LABELS[r.kind] ?? r.kind },
                      { key: "cost", label: "Cost", numeric: true, render: (r) => formatBDT(r.costMinor) },
                    ]}
                  />
                }
              />
            </div>

            <ChartCard
              title="Sign-ups, first bookings and cost per day"
              definition="Lines: accounts created with a code, and referrals that qualified (first completed booking), per Dhaka day. Bars: the referral discount paid by the platform that day, on its own axis on the right."
              chart={
                <LinesAndBars
                  rows={data.daily.map((d) => ({ day: d.day, attached: d.attached, qualified: d.qualified, cost: d.costMinor }))}
                  lines={[
                    { key: "attached", label: "Sign-ups", color: "var(--chart-1)" },
                    { key: "qualified", label: "First bookings", color: "var(--chart-2)" },
                  ]}
                  bar={{ key: "cost", label: "Cost", color: "var(--chart-3)", unit: "minor" }}
                />
              }
              table={
                <DataTable
                  caption="Referrals per day"
                  rows={data.daily}
                  rowKey={(d) => d.day}
                  columns={[
                    { key: "day", label: "Day", render: (d) => formatDayFull(d.day) },
                    { key: "attached", label: "Sign-ups", numeric: true, render: (d) => formatMetric(d.attached, "count") },
                    { key: "qualified", label: "First bookings", numeric: true, render: (d) => formatMetric(d.qualified, "count") },
                    { key: "cost", label: "Cost", numeric: true, render: (d) => formatBDT(d.costMinor) },
                  ]}
                />
              }
            />

            <ChartCard
              title="Top referrers"
              definition="Ranked by friends who qualified in the range, then by what their rewards cost. Names are shortened."
              table={
                <DataTable
                  caption="Top referrers"
                  rows={data.topReferrers}
                  rowKey={(r) => r.userId}
                  empty="Nobody's friends qualified in this range."
                  columns={[
                    {
                      key: "name",
                      label: "Referrer",
                      render: (r) =>
                        canUsers ? (
                          <Link href={`/dashboard/admin/users/${r.userId}`} className="text-primary underline-offset-4 hover:underline">
                            {r.name || "Customer"}
                          </Link>
                        ) : (
                          r.name || "Customer"
                        ),
                    },
                    { key: "qualified", label: "Qualified", numeric: true, render: (r) => formatMetric(r.qualified, "count") },
                    { key: "rewards", label: "Rewards", numeric: true, render: (r) => formatMetric(r.rewards, "count") },
                    { key: "cost", label: "Cost", numeric: true, render: (r) => formatBDT(r.costMinor) },
                  ]}
                />
              }
            />
          </>
        )}
      </div>
    </FilterNavigationProvider>
  );
}

const pct = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 1 });

/** Link opens → sign-ups → verified → first booking → referrer rewarded, with the drop at each step. */
function Funnel({ data }: { data: AdminReferralOverview }) {
  const steps = data.funnel.map((s, i) => {
    const before = i > 0 ? data.funnel[i - 1].count : null;
    return {
      key: s.key,
      label: s.label,
      value: s.count,
      fromPrevious: before ? (s.count / before) * 100 : null,
    };
  });
  return (
    <ChartCard
      title="Funnel"
      definition="Each step in the range. Link opens are counted from the invite page's tracking (cookieless, no test flag), so they can trail the other steps."
      chart={<FunnelBars steps={steps} label="Referral funnel" />}
      table={
        <DataTable
          caption="Referral funnel"
          rows={steps}
          rowKey={(s) => s.key}
          columns={[
            { key: "step", label: "Step", render: (s) => s.label },
            { key: "count", label: "Count", numeric: true, render: (s) => formatMetric(s.value, "count") },
            {
              key: "drop",
              label: "Drop from previous",
              numeric: true,
              render: (s) => (s.fromPrevious === null ? "—" : `${pct.format(Math.max(0, 100 - s.fromPrevious))}%`),
            },
          ]}
        />
      }
    />
  );
}

function CsvLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Download aria-hidden className="size-4" /> {label}
    </a>
  );
}
