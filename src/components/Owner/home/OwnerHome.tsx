import type { OwnerHomeData } from "@/services/owner/home-types";
import { NeedsAttention } from "./NeedsAttention";
import { TodayStrip } from "./TodayStrip";
import { SetupChecklist } from "./SetupChecklist";
import { WeekVsLast } from "./WeekVsLast";
import { BranchesTable } from "./BranchesTable";

/**
 * The owner's Today v2, top to bottom: what needs doing, today, setup left,
 * the week against the last, and every branch. Dashboard renders the money
 * card after it.
 */
export function OwnerHome({ home }: { home: OwnerHomeData }) {
  return (
    <>
      <NeedsAttention attention={home.attention} salonId={home.scope.salonId} />
      <TodayStrip today={home.today} />
      <SetupChecklist setup={home.setup} />
      <WeekVsLast week={home.week} />
      {home.branches && home.branches.length > 0 && (
        <BranchesTable branches={home.branches} total={home.branchesTotal} />
      )}
    </>
  );
}
