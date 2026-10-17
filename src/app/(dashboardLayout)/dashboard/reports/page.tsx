import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { BranchSwitcher } from "@/components/Dashboard/BranchSwitcher";
import { formatRange } from "@/components/Admin/analytics/format";
import { ReportFilterRow, ReportTabs } from "@/components/Owner/reports/ReportControls";
import { parseReportFilters, reportCsvHref, type ReportFilters } from "@/components/Owner/reports/report-filters";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { ownsAny } from "@/lib/owner-access";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getOwnerReport } from "@/services/owner/getOwnerReport";
import type { OwnerReportName, ReportData } from "@/services/owner/report-types";
import {
  BookingsTab,
  CustomersTab,
  DiscoveryTab,
  MoneyTab,
  OverviewTab,
  ServicesTab,
  TeamTab,
  UtilisationTab,
  type TabProps,
} from "./_tabs";

export const metadata: Metadata = { title: "Reports" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS: { [K in OwnerReportName]: (props: TabProps<ReportData[K]>) => React.ReactNode } = {
  overview: OverviewTab,
  bookings: BookingsTab,
  services: ServicesTab,
  team: TeamTab,
  customers: CustomersTab,
  utilisation: UtilisationTab,
  discovery: DiscoveryTab,
  money: MoneyTab,
};

async function ReportBody<K extends OwnerReportName>({ tab, filters, salonId }: { tab: K; filters: ReportFilters; salonId?: string }) {
  const res = await getOwnerReport(tab, { salonId, from: filters.from, to: filters.to, compare: filters.compare });
  if (!res.success || !res.data) return <ErrorState title="This report couldn't be loaded" message={res.message} />;
  if (!res.data.data) {
    return <EmptyState icon={BarChart3} title="No branches here" description="There is nothing to report for this selection." />;
  }
  const Tab = TABS[tab] as (props: TabProps<ReportData[K]>) => React.ReactNode;
  return <Tab data={res.data.data} filters={filters} compare={res.data.compare} csv={reportCsvHref(filters, salonId)} />;
}

/**
 * Owner and manager reports: one filter row (all in the URL), the branch from
 * the switcher, eight tabs, each one cached server fetch (5 min).
 */
export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, access, selected] = await Promise.all([searchParams, getMyAccess(), getSelectedSalonId()]);
  const branches = (access.success ? (access.data ?? []) : []).filter((b) => b.permissions.includes("reports.view"));
  const owner = ownsAny(access);
  const allowAll = owner && branches.length > 1;
  const salonId =
    selected && branches.some((b) => b.salonId === selected) ? selected : allowAll ? undefined : branches[0]?.salonId;
  const filters = parseReportFilters(params, owner);

  const header = (
    <PageHeader
      title="Reports"
      description={`${formatRange(filters.from, filters.to)} · Asia/Dhaka days`}
      actions={
        branches.length > 1 ? (
          <BranchSwitcher branches={branches} selected={salonId ?? ""} allowAll={allowAll} />
        ) : undefined
      }
    />
  );

  if (!access.success) {
    return (
      <div className="space-y-5">
        {header}
        <ErrorState message={access.message} />
      </div>
    );
  }
  if (!branches.length) {
    return (
      <div className="space-y-5">
        {header}
        <EmptyState icon={BarChart3} title="No reports here" description="You can't see reports at any branch." />
      </div>
    );
  }

  return (
    <FilterNavigationProvider>
      <div className="min-w-0 space-y-5">
        {header}
        <ReportFilterRow filters={filters} />
        <ReportTabs current={filters.tab} showMoney={owner} />
        <ReportBody tab={filters.tab} filters={filters} salonId={salonId} />
      </div>
    </FilterNavigationProvider>
  );
}
