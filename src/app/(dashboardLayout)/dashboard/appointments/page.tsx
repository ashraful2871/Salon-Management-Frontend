import Appointments from "@/components/Dashboard/Appointments";
import { getAllAppointments } from "@/services/appoinments/getAllAppointments";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import React from "react";

// ✅ Force dynamic rendering (no static cache), ensures fresh data on every request
export const dynamic = "force-dynamic";
export const revalidate = 0;

const AppointmentsPage = async () => {
  const res = await getAllAppointments();
  const userRole = await getUserRoles();

  // ✅ Your API shape: { success, meta, data: [...] }
  const appointments = res?.data ?? [];

  return (
    <div>
      <Appointments appointments={appointments} userRole={userRole ?? "GUEST"} />
    </div>
  );
};

export default AppointmentsPage;
