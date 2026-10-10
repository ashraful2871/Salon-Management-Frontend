import type { Metadata } from "next";
import { PageHeader } from "@/components/Shared/PageHeader";
import { AnalyticsTabs } from "@/components/Admin/analytics/AnalyticsTabs";
import { ANALYTICS_TABS, type AnalyticsTab } from "@/components/Admin/analytics/tabs";
import { DateRangeFilter } from "@/components/Admin/analytics/DateRangeFilter";
import { parseAnalyticsFilters } from "@/components/Admin/analytics/filters";
import { formatRange } from "@/components/Admin/analytics/format";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { getAdminAreas } from "@/services/admin/agents/getAdminAreas";
import { getMetricDefinitions } from "@/services/admin/analytics/getMetricDefinitions";
import { OverviewTab } from "./_tabs/overview";
import { BookingsTab } from "./_tabs/bookings";
import { CustomersTab } from "./_tabs/customers";
import { SalonsTab } from "./_tabs/salons";
import { DiscoveryTab } from "./_tabs/discovery";
import { AssistantTab } from "./_tabs/assistant";
import { TryOnTab } from "./_tabs/tryon";

export const metadata: Metadata = { title: "Analytics | Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const nowMs = () => Date.now();

const TABS = {
  overview: OverviewTab,
  bookings: BookingsTab,
  customers: CustomersTab,
  salons: SalonsTab,
  discovery: DiscoveryTab,
  assistant: AssistantTab,
  tryon: TryOnTab,
} satisfies Record<AnalyticsTab, unknown>;

/**
 * Every Phase 10 metric, read through one filter row (all in the URL) and
 * split into tabs (`?tab=`), each one server fetch cached for 5 minutes.
 */
export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = parseAnalyticsFilters(params);
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab = (ANALYTICS_TABS.find((t) => t.key === rawTab)?.key ?? "overview") as AnalyticsTab;
  const Tab = TABS[tab];

  // Areas need agents.manage; without it the area picker is simply empty.
  const [metrics, areas] = await Promise.all([getMetricDefinitions(), getAdminAreas()]);
  const defs = Object.fromEntries((metrics.success ? (metrics.data ?? []) : []).map((m) => [m.id, m.definition]));
  const areaNames = areas.success
    ? [...new Set((areas.data ?? []).map((a) => a.area))].sort((a, b) => a.localeCompare(b))
    : [];

  return (
    <FilterNavigationProvider>
      <div className="min-w-0 space-y-5">
        <PageHeader
          title="Analytics"
          description={`${formatRange(filters.from, filters.to)}${filters.includeTest ? " · including test data" : ""}`}
        />
        <DateRangeFilter filters={filters} areas={areaNames} />
        <AnalyticsTabs current={tab} />
        <Tab filters={filters} defs={defs} nowMs={nowMs()} />
      </div>
    </FilterNavigationProvider>
  );
}
