import Appointments from "@/components/Dashboard/Appointments";
import { getAllAppointments } from "@/services/appoinments/getAllAppointments";
import React from "react";

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
