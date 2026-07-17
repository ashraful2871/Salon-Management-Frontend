/* eslint-disable @typescript-eslint/no-explicit-any */
import Dashboard from "@/components/Dashboard/Dashboard";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import {
  getAdminDashboardStats,
  getSalonOwnerDashboardStats,
  getCustomerDashboardStats,
} from "@/services/dashboard/getDashboardStats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const userRole = await getUserRoles();

  let dashboardData = null;

  if (userRole === "ADMIN") {
    dashboardData = await getAdminDashboardStats();
  } else if (userRole === "SALON_OWNER") {
    dashboardData = await getSalonOwnerDashboardStats();
  } else if (userRole === "CUSTOMER") {
    dashboardData = await getCustomerDashboardStats();
  }

  return (
    <div>
      <Dashboard dashboardData={dashboardData as any} userRole={userRole ?? "GUEST"} />
    </div>
  );
}
