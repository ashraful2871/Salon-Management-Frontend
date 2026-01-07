import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import React from "react";

const CommonDashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="ml-64 min-h-screen p-6 transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CommonDashboardLayout;
