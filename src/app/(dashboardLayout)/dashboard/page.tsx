import Dashboard from "@/components/Dashboard/Dashboard";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import {
  getAdminDashboardStats,
  getSalonOwnerDashboardStats,
  getCustomerDashboardStats,
} from "@/services/dashboard/getDashboardStats";

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
      <Dashboard
        dashboardData={dashboardData?.data ?? dashboardData}
        userRole={userRole ?? "GUEST"}
      />
    </div>
  );
}
