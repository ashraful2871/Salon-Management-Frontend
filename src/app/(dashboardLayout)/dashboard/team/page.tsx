import { Users } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { BranchSwitcher } from "@/components/Dashboard/BranchSwitcher";
import { TeamClient } from "@/components/Owner/team/TeamClient";
import { TeamTabs } from "@/components/Owner/team/TeamTabs";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { canAt, roleAt } from "@/lib/owner-access";
import { getSessionUser } from "@/services/auth/session";
import { getSalonMembers } from "@/services/team/getSalonMembers";
import { getSalonInvitations } from "@/services/team/getSalonInvitations";
import { getSalonById } from "@/services/salon/getSalonNyId";

export const metadata = { title: "Team" };

/**
 * A branch's people. The team works one branch at a time: on "All branches"
 * the owner picks one here (same cookie as the top-bar switcher).
 */
export default async function TeamPage() {
  const [access, selected, me] = await Promise.all([
    getMyAccess(),
    getSelectedSalonId(),
    getSessionUser(),
  ]);
  const branches = (access.success ? (access.data ?? []) : []).filter((b) =>
    b.permissions.includes("team.invite"),
  );
  const salonId = selected && canAt(branches, "team.invite", selected) ? selected : undefined;
  const branch = branches.find((b) => b.salonId === salonId);

  const header = (
    <>
      <PageHeader
        title="Team"
        description="Invite people, set their hours, and see how each stylist is doing."
        actions={
          branches.length > 1 ? (
            <BranchSwitcher branches={branches} selected={salonId ?? ""} allowAll={false} />
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

  if (!branch) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={Users}
          title={branches.length ? "Choose a branch" : "No team to manage"}
          description={
            branches.length
              ? "Each branch has its own team. Pick one above to see and invite its people."
              : "You don't manage a team at any branch."
          }
        />
      </div>
    );
  }

  const isOwner = roleAt(access, branch.salonId) === "OWNER";
  const [members, invitations, salon] = await Promise.all([
    getSalonMembers(branch.salonId),
    getSalonInvitations(branch.salonId),
    isOwner ? getSalonById(branch.salonId) : null,
  ]);

  return (
    <div className="space-y-6">
      {header}
      {!members.success ? (
        <ErrorState message={members.message} />
      ) : (
        <TeamClient
          // A new branch starts a new list (optimistic state included).
          key={branch.salonId}
          salonId={branch.salonId}
          salonName={branch.salonName}
          isOwner={isOwner}
          meUserId={me?.userId}
          members={members.data ?? []}
          invitations={invitations.success ? (invitations.data ?? []) : []}
          managerCanEditServices={
            isOwner && salon?.success ? !!salon.data?.managerCanEditServices : undefined
          }
        />
      )}
    </div>
  );
}
