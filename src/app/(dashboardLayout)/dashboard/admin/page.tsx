import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { dashboardGreeting } from "@/lib/greeting";
import { can } from "@/lib/admin-permissions";
import { PageHeader } from "@/components/Shared/PageHeader";
import { NeedsAttention } from "@/components/Admin/home/NeedsAttention";
import { SystemStrip, SystemStripSkeleton } from "@/components/Admin/system/SystemStrip";
import { DateRangeFilter } from "@/components/Admin/analytics/DateRangeFilter";
import { parseAnalyticsFilters } from "@/components/Admin/analytics/filters";
import { formatRange, kpiById } from "@/components/Admin/analytics/format";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { getDisplayUser } from "@/services/auth/displayUser";
import { getAdminInbox } from "@/services/admin/getAdminInbox";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getMetricDefinitions } from "@/services/admin/analytics/getMetricDefinitions";
import {
  BookingsPerDay,
  FunnelCard,
  loadOverview,
  TopAreasCard,
} from "./analytics/_tabs/overview";
import { HeroFigure, KpiGrid, ReportError, UpdatedNote } from "./analytics/_tabs/shared";

export const metadata: Metadata = { title: "Home | Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const nowMs = () => Date.now();

/**
 * Back-office Home v2: what needs attention first, then (with analytics.view)
 * the headline figures for a preset range. An agent's inbox only ever holds
 * the salon queue for their area, which is all they see here.
 */
export default async function AdminHomePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [display, inbox, me] = await Promise.all([
    getDisplayUser(),
    getAdminInbox(),
    isAdmin ? getAdminMe() : null,
  ]);
  const { greeting } = dashboardGreeting(display);
  const items = inbox.success ? (inbox.data ?? []) : [];
  const permissions = me?.success ? (me.data?.permissions ?? []) : [];
  const showFigures = isAdmin && can(permissions, "analytics.view");
  const showSystem = isAdmin && can(permissions, "system.view");

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Home" description={greeting} />

      <NeedsAttention
        items={isAdmin ? items : items.filter((i) => i.key === "salons.pending")}
        error={inbox.success ? null : inbox.message}
        nowMs={nowMs()}
      />

      {showSystem && (
        <Suspense fallback={<SystemStripSkeleton />}>
          <SystemStrip />
        </Suspense>
      )}

      {showFigures && <HomeFigures params={await searchParams} />}
    </div>
  );
}

async function HomeFigures({ params }: { params: Record<string, string | string[] | undefined> }) {
  // Presets only here; the full filter row lives on the Analytics page.
  const preset = params.range === "custom" ? { ...params, range: "30d" } : params;
  const filters = { ...parseAnalyticsFilters(preset), area: undefined, channel: undefined };
  const [data, metrics] = await Promise.all([loadOverview(filters), getMetricDefinitions()]);
  const defs = Object.fromEntries((metrics.success ? (metrics.data ?? []) : []).map((m) => [m.id, m.definition]));
  const o = data.overview;

  return (
    <FilterNavigationProvider>
      <section aria-labelledby="home-figures" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="home-figures" className="text-lg font-semibold">
              Platform figures
            </h2>
            {o && <UpdatedNote at={o.fetchedAt} nowMs={nowMs()} />}
          </div>
          <Link
            href="/dashboard/admin/analytics"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-hover hover:underline"
          >
            All analytics <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <DateRangeFilter filters={filters} presetsOnly />

        {!o ? (
          <ReportError message={data.error ?? "No data."} />
        ) : (
          <>
            <HeroFigure
              kpi={kpiById(o.kpis, "gmv.completedMinor")}
              series={o.series["gmv.completedMinor"]}
              defs={defs}
              rangeText={formatRange(o.range.from, o.range.to)}
            />
            <KpiGrid
              report={o}
              defs={defs}
              labels={{ "bookings.created": "Bookings" }}
              ids={[
                "commission.minor",
                "bookings.created",
                "customers.new",
                data.salons ? kpiById(data.salons.kpis, "salons.active30d") : undefined,
              ]}
              sparks={{
                "commission.minor": o.series["commission.minor"],
                "bookings.created": o.series["bookings.created"],
              }}
            />
            <BookingsPerDay data={data} filters={filters} defs={defs} />
            <div className="grid gap-4 lg:grid-cols-2">
              <FunnelCard funnel={data.funnel} filters={filters} defs={defs} />
              <TopAreasCard geo={data.geo} filters={filters} defs={defs} />
            </div>
          </>
        )}

      </section>
    </FilterNavigationProvider>
  );
}
