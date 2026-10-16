import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { BranchSwitcher } from "@/components/Dashboard/BranchSwitcher";
import { TeamTabs } from "@/components/Owner/team/TeamTabs";
import { TeamPerformanceView } from "@/components/Owner/team/TeamPerformanceView";
import { presetRange } from "@/components/Money/money-format";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getTeamPerformance } from "@/services/owner/getTeamPerformance";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { ownsAny } from "@/lib/owner-access";

export const metadata = { title: "Team performance" };

const PRESETS = ["month", "last-month", "7d", "30d"] as const;

/**
 * Per stylist: bookings, completed, revenue, rating, no-shows, utilisation.
 * The CSV is the payroll report: the owner pays their team themselves.
 */
export default async function TeamPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ range: rawRange }, access, selected] = await Promise.all([
    searchParams,
    getMyAccess(),
    getSelectedSalonId(),
  ]);
  const range = (PRESETS as readonly string[]).includes(rawRange ?? "") ? rawRange! : "month";
  const { from, to } = presetRange(range);

  const branches = (access.success ? (access.data ?? []) : []).filter((b) =>
    b.permissions.includes("reports.view"),
  );
  const allowAll = ownsAny(access) && branches.length > 1;
  const salonId =
    selected && branches.some((b) => b.salonId === selected)
      ? selected
      : allowAll
        ? undefined
        : branches[0]?.salonId;

  const header = (
    <>
      <PageHeader
        title="Team"
        description="Invite people, set their hours, and see how each stylist is doing."
        actions={
          branches.length > 1 ? (
            <BranchSwitcher branches={branches} selected={salonId ?? ""} allowAll={allowAll} />
          ) : undefined
        }
      />
      <TeamTabs />
    </>
  );

  if (!access.success) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState message={access.message} />
      </div>
    );
  }

  if (!branches.length) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState icon={BarChart3} title="No reports here" description="You can't see reports at any branch." />
      </div>
    );
  }

  const result = await getTeamPerformance({ salonId, from, to });

  return (
    <div className="space-y-6">
      {header}
      {!result.success || !result.data ? (
        <ErrorState message={result.message} />
      ) : (
        <TeamPerformanceView data={result.data} range={range} salonId={salonId} showBranch={!salonId} />
      )}
    </div>
  );
}
