import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard/Dashboard";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getDisplayUser } from "@/services/auth/displayUser";
import {
  getSalonOwnerDashboardStats,
  getCustomerDashboardStats,
} from "@/services/dashboard/getDashboardStats";
import { dashboardGreeting } from "@/lib/greeting";
import { ROLE_HOME } from "@/lib/route-access";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { getOwnerMoneySummary } from "@/services/owner/getOwnerMoneySummary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATS_FOR: Record<string, () => ReturnType<typeof getCustomerDashboardStats>> = {
  // The branch switcher's choice; every branch when it is "All branches".
  SALON_OWNER: async () => getSalonOwnerDashboardStats(await getSelectedSalonId()),
  CUSTOMER: getCustomerDashboardStats,
};

export default async function DashboardPage() {
  const [userRole, display] = await Promise.all([
    getUserRoles(),
    getDisplayUser(),
  ]);
  const role = userRole ?? "GUEST";

  // The proxy already sends them on; this covers a request it did not see.
  if (role === "ADMIN" || role === "AGENT") redirect(ROLE_HOME[role]);

  const load = STATS_FOR[role];
  // The services return the whole envelope; the stats are under `data`.
  const [result, money] = await Promise.all([
    load ? load() : null,
    role === "SALON_OWNER"
      ? getSelectedSalonId().then((salonId) => getOwnerMoneySummary(salonId))
      : null,
  ]);
  const stats = result?.success ? (result.data ?? null) : null;

  const { greeting, now } = dashboardGreeting(display);

  return (
    <Dashboard
      dashboardData={stats}
      moneySummary={money?.success ? (money.data ?? null) : null}
      loadError={result && !result.success ? result.message : null}
      userRole={role}
      greeting={greeting}
      now={now}
    />
  );
}
