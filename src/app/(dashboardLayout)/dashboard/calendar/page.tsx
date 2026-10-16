import { runsBranch } from "@/lib/owner-access";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { EmptyState } from "@/components/Shared/EmptyState";
import { CalendarView } from "@/components/Owner/calendar/CalendarView";
import { dhakaNow, weekStart } from "@/components/Owner/calendar/calendar-grid";
import { dhakaToday } from "@/components/Dashboard/appointments/format";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getCalendar } from "@/services/appoinments/getCalendar";
import { getAllAppointments } from "@/services/appoinments/getAllAppointments";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const isDay = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const [role, params] = await Promise.all([getUserRoles(), searchParams]);
  const today = dhakaToday();
  const requested = first(params.date);
  const date = isDay(requested) ? requested : today;
  const view = first(params.view) === "week" ? "week" : "day";

  // One branch at a time: the owner's or manager's switcher; staff work at one salon.
  const salonId =
    runsBranch(role)
      ? await getSelectedSalonId()
      : (await getMyAccess()).data?.[0]?.salonId;

  const header = (
    <PageHeader
      title="Calendar"
      description={role === "STAFF" ? "Your bookings, by time." : "Run the day: every stylist or counter, by time."}
    />
  );

  if (!salonId) {
    return (
      <>
        {header}
        <EmptyState
          icon={CalendarDays}
          title="Pick a branch"
          description="The calendar shows one branch at a time. Choose a branch in the switcher at the top of the page."
        />
      </>
    );
  }

  const [calendar, list] = await Promise.all([
    getCalendar({ salonId, from: view === "week" ? weekStart(date) : date, view }),
    view === "day" ? getAllAppointments({ date, salonId, limit: 100 }) : null,
  ]);

  if (!calendar.success || !calendar.data) {
    return (
      <>
        {header}
        <p role="alert" className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          The calendar couldn&apos;t be loaded: {calendar.message}
        </p>
      </>
    );
  }

  return (
    <>
      {header}
      {list && !list.success && (
        <p role="alert" className="mb-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          Bookings couldn&apos;t be loaded: {list.message}
        </p>
      )}
      <CalendarView
        data={calendar.data}
        appointments={list?.success ? (list.data ?? []) : []}
        role={role ?? "GUEST"}
        date={date}
        view={view}
        today={today}
        nowHHmm={dhakaNow()}
        openId={first(params.open)}
      />
    </>
  );
}
