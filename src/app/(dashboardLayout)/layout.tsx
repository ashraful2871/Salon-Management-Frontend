import { DashboardShell } from "@/components/layout/DashboardSidebar";
import SessionKeeper from "@/components/Shared/SessionKeeper";
import { requireUser } from "@/lib/auth-guard";
import { getDisplayUser } from "@/services/auth/displayUser";
import { cookies } from "next/headers";
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
  // Same session, with the real name filled in for the top bar.
  const display = (await getDisplayUser()) ?? user;
  // The sidebar's collapse toggle writes this, so a reload renders it as left.
  const collapsed = (await cookies()).get("sm_sidebar")?.value === "1";

  return (
    <DashboardShell
      user={{ role: user.role, name: display.name, email: user.email }}
      initialCollapsed={collapsed}
    >
      <SessionKeeper />
      {children}
    </DashboardShell>
  );
};

export default CommonDashboardLayout;
