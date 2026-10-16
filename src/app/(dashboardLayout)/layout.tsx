import { DashboardShell } from "@/components/layout/DashboardSidebar";
import SessionKeeper from "@/components/Shared/SessionKeeper";
import { ImpersonationBanner } from "@/components/Shared/ImpersonationBanner";
import { requireUser } from "@/lib/auth-guard";
import { getDisplayUser } from "@/services/auth/displayUser";
import { ADMIN_SECURITY_PATH, PATHNAME_HEADER } from "@/lib/route-access";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminInbox } from "@/services/admin/getAdminInbox";
import type { AdminShellData } from "@/components/Admin/AdminTopBar";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getSelectedBranch } from "@/lib/branch-cookie";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The dashboard's front door: nothing below this renders without a session.
 *
 * `requireUser` verifies the token's signature rather than trusting the proxy's
 * read of it, so a request that somehow skipped the edge - a Server Action, a
 * hand-crafted RSC fetch - is turned away here instead of rendering as far as
 * the first service call and then showing an empty page.
 *
 * Role gating is *not* done here. A layout is reused across a client-side
 * navigation between its children, so a check written at this level would not
 * run again when the user moves from one dashboard page to another; the
 * per-segment layouts do it instead, each guarding its own subtree.
 */
const CommonDashboardLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const user = await requireUser();

  // An admin or agent without 2FA lands on its setup from any dashboard page,
  // so signing in leads straight there. (Runs on entering the dashboard; the
  // admin layout repeats it for its own subtree.) Their permissions drive the
  // nav, and the inbox feeds the top-bar bell.
  let admin: AdminShellData | undefined;
  if (user.role === "ADMIN" || user.role === "AGENT") {
    const [me, inbox] = await Promise.all([getAdminMe(), getAdminInbox()]);
    const path = (await headers()).get(PATHNAME_HEADER) ?? "";
    if (!path.startsWith(ADMIN_SECURITY_PATH) && me.success && me.data?.mfa.enrolled === false) {
      redirect(ADMIN_SECURITY_PATH);
    }
    admin = {
      permissions: me.success ? (me.data?.permissions ?? []) : [],
      stepUpUntil: me.success ? (me.data?.mfa.stepUpUntil ?? null) : null,
      inbox: inbox.success ? (inbox.data ?? []) : null,
      approvals: me.success && !!(me.data?.approvals?.enabled || me.data?.approvals?.pending),
    };
  }
  // The owner's branch switcher: every page below reads the same choice.
  // Managers get it too, pinned to their branches (no "All branches").
  let branches:
    | { options: { salonId: string; salonName: string }[]; selected: string; allowAll: boolean }
    | undefined;
  if (user.role === "SALON_OWNER" || user.role === "BRANCH_MANAGER") {
    const [access, selected] = await Promise.all([getMyAccess(), getSelectedBranch()]);
    branches = {
      options: access.success ? (access.data ?? []) : [],
      allowAll: user.role === "SALON_OWNER",
      selected,
    };
  }
  // Same session, with the real name filled in for the top bar.
  const display = (await getDisplayUser()) ?? user;
  // The sidebar's collapse toggle writes this, so a reload renders it as left.
  const collapsed = (await cookies()).get("sm_sidebar")?.value === "1";

  return (
    <DashboardShell
      user={{ role: user.role, name: display.name, email: user.email }}
      initialCollapsed={collapsed}
      admin={admin}
      branches={branches}
    >
      <SessionKeeper />
      <ImpersonationBanner />
      {children}
    </DashboardShell>
  );
};

export default CommonDashboardLayout;
