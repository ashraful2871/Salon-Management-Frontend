import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import SessionKeeper from "@/components/Shared/SessionKeeper";
import { requireUser } from "@/lib/auth-guard";
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

  return (
    <div className="flex h-screen overflow-hidden">
      <SessionKeeper />
      <DashboardSidebar userRole={user.role} />

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="ml-64 min-h-screen p-6 transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CommonDashboardLayout;
