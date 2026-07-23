import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CommonDashboardLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const userRole = await getUserRoles();

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar userRole={userRole ?? "GUEST"} />

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="ml-64 min-h-screen p-6 transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CommonDashboardLayout;
