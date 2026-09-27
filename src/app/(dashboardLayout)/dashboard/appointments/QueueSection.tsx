import { TodayQueue } from "@/components/Dashboard/appointments/TodayQueue";
import type { Appointment } from "@/lib/api-types";
import type { getAllAppointments } from "@/services/appoinments/getAllAppointments";

// Today's whole queue, independent of the list's filters and pages. It streams
// in behind its own skeleton, so the list never waits for it. The page starts
// the read before it awaits the list, so the two run side by side.
export default async function QueueSection({
  read,
}: {
  read: ReturnType<typeof getAllAppointments>;
}) {
  const res = await read;
  return <TodayQueue appointments={(res?.data ?? []) as Appointment[]} />;
}
