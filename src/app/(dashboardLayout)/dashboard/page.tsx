import Dashboard from "@/components/Dashboard/Dashboard";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getDisplayUser } from "@/services/auth/displayUser";
import {
  getAdminDashboardStats,
  getSalonOwnerDashboardStats,
  getCustomerDashboardStats,
} from "@/services/dashboard/getDashboardStats";
import { dhakaToday, formatDay } from "@/components/Dashboard/appointments/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATS_FOR: Record<string, typeof getAdminDashboardStats> = {
  ADMIN: getAdminDashboardStats,
  SALON_OWNER: getSalonOwnerDashboardStats,
  CUSTOMER: getCustomerDashboardStats,
};

// "Now" in Dhaka, worked out here so the server and the browser render the
// same greeting and the same "upcoming" booking.
const dhakaNow = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());

const greetingAt = (hhmm: string) => {
  const hour = Number(hhmm.slice(0, 2));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default async function DashboardPage() {
  const [userRole, display] = await Promise.all([
    getUserRoles(),
    getDisplayUser(),
  ]);
  const role = userRole ?? "GUEST";

  const load = STATS_FOR[role];
  // The services return the whole envelope; the stats are under `data`.
  const result = load ? await load() : null;
  const stats = result?.success ? (result.data ?? null) : null;

  const ymd = dhakaToday();
  const hhmm = dhakaNow();
  const firstName = display?.hasName ? display.name.trim().split(/\s+/)[0] : "";
  const greeting = `${greetingAt(hhmm)}${firstName ? `, ${firstName}` : ""} · ${formatDay(ymd)}`;

  return (
    <Dashboard
      dashboardData={stats}
      loadError={result && !result.success ? result.message : null}
      userRole={role}
      greeting={greeting}
      now={{ ymd, hhmm }}
    />
  );
}
