/* eslint-disable @typescript-eslint/no-explicit-any */
import Appointments from "@/components/Dashboard/Appointments";
import { getAllAppointments } from "@/services/appoinments/getAllAppointments";
import { getUserRoles } from "@/services/get-roles/getUserRoles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AppointmentsPage = async () => {
  const res = await getAllAppointments();
  const userRole = await getUserRoles();

  const appointments = res?.data ?? [];

  return (
    <div>
      <Appointments appointments={appointments as any} userRole={userRole ?? "GUEST"} />
    </div>
  );
};

export default AppointmentsPage;
