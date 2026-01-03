import React from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const CommonDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default CommonDashboardLayout;
