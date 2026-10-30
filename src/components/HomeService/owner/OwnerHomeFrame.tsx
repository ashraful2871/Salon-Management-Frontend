import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";

import { EmptyState } from "@/components/Shared/EmptyState";
import { PageHeader } from "@/components/Shared/PageHeader";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { getOwnerHomeProfile } from "@/services/home-service/getOwnerHomeProfile";
import type { OwnerHomeProfile } from "@/services/home-service/types";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { FollowBranch } from "./FollowBranch";
import { BEFORE_TURN_ON, HOME_BASE, type OwnerHomeTab } from "./format";
import { OwnerHomeTabs } from "./OwnerHomeTabs";

const TITLE = "Home Service";

/**
 * Every Home Service page: the branch, its profile and the tabs. A branch that
 * never turned it on has no tabs: the owner gets the card and the two pages its
 * checklist links to, anyone else a 404.
 */
export async function OwnerHomeFrame({
  tab,
  wanted,
  children,
}: {
  tab: OwnerHomeTab;
  /** `?salonId=` from an email link. */
  wanted?: string;
  children: (home: OwnerHomeProfile) => ReactNode;
}) {
  const [access, selected] = await Promise.all([getMyAccess(), getSelectedSalonId()]);
  const branches = access.success ? (access.data ?? []) : [];
  const follow = wanted && wanted !== selected && branches.some((b) => b.salonId === wanted) ? wanted : undefined;
  const salonId = follow ?? selected ?? (branches.length === 1 ? branches[0].salonId : undefined);

  if (!salonId) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title={TITLE} />
        <EmptyState
          icon={Store}
          title="Pick a branch"
          description="Home Service is set up one branch at a time. Choose a branch in the switcher at the top of the page."
        />
      </div>
    );
  }

  const res = await getOwnerHomeProfile(salonId);
  if (!res.success || !res.data) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title={TITLE} />
        <EmptyState title="We couldn't load Home Service" description={res.message} />
      </div>
    );
  }

  const home = res.data;
  const started = home.profile.exists === true;
  if (!started && !home.canSwitch) notFound();
  if (!started && !BEFORE_TURN_ON.includes(tab)) redirect(HOME_BASE);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {follow && <FollowBranch salonId={follow} />}
      <PageHeader title={TITLE} description={home.salon.name} />
      {started ? (
        <OwnerHomeTabs />
      ) : (
        tab !== "setup" && (
          <Link
            href={HOME_BASE}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to the checklist
          </Link>
        )
      )}
      {children(home)}
    </div>
  );
}
