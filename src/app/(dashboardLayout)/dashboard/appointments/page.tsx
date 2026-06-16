import Appointments from "@/components/Dashboard/Appointments";
import { getAllAppointments } from "@/services/appoinments/getAllAppointments";
import React from "react";

// ✅ Force dynamic rendering (no static cache), ensures fresh data on every request
export const dynamic = "force-dynamic";
export const revalidate = 0;

const AppointmentsPage = async () => {
  const res = await getAllAppointments();

  // ✅ Your API shape: { success, meta, data: [...] }
  const appointments = res?.data ?? [];

  return (
    <div>
      <Appointments appointments={appointments} />
    </div>
  );
};

export default AppointmentsPage;
