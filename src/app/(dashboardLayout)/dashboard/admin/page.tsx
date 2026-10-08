import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guard";
import { dashboardGreeting } from "@/lib/greeting";
import { PageHeader } from "@/components/Shared/PageHeader";
import { NeedsAttention } from "@/components/Admin/home/NeedsAttention";
import { AdminOverview } from "@/components/Admin/home/AdminOverview";
import { getDisplayUser } from "@/services/auth/displayUser";
import { getAdminInbox } from "@/services/admin/getAdminInbox";
import { getAdminDashboardStats } from "@/services/dashboard/getDashboardStats";

export const metadata: Metadata = { title: "Home | Admin" };

const nowMs = () => Date.now();

/**
 * Back-office Home v1: what needs attention first, then (ADMIN) the platform
 * figures the role dashboard used to show. An agent's inbox only ever holds
 * the salon queue for their area, which is all they see here.
 */
export default async function AdminHomePage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [display, inbox, stats] = await Promise.all([
    getDisplayUser(),
    getAdminInbox(),
    isAdmin ? getAdminDashboardStats() : null,
  ]);
  const { greeting, now } = dashboardGreeting(display);
  const items = inbox.success ? (inbox.data ?? []) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Home" description={greeting} />

      <NeedsAttention
        items={isAdmin ? items : items.filter((i) => i.key === "salons.pending")}
        error={inbox.success ? null : inbox.message}
        nowMs={nowMs()}
      />

      {stats && !stats.success && (
        <p
          role="alert"
          className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          Your figures couldn&apos;t be loaded: {stats.message}
        </p>
      )}
      {stats?.success && stats.data && <AdminOverview data={stats.data} now={now} />}
    </div>
  );
}
