/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import Appointments from "@/components/Dashboard/Appointments";
import {
  CashSummarySkeleton,
  QueueSkeleton,
} from "@/components/Shared/SkeletonCard";
import { FilterNavigationProvider } from "@/hooks/useFilterNavigation";
import { getAllAppointments } from "@/services/appoinments/getAllAppointments";
import { getCashSummary } from "@/services/appoinments/getCashSummary";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import CashSection from "./CashSection";
import QueueSection from "./QueueSection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const AppointmentsPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const userRole = await getUserRoles();
  const params = await searchParams;

  // The salon side works one day at a time, so it opens on today in Dhaka.
  // `date=all` is how the "All Dates" button opts out of that default.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(new Date());
  const requestedDate = first(params.date);
  const opensOnToday = userRole === "SALON_OWNER" || userRole === "STAFF";
  const date =
    requestedDate === "all"
      ? undefined
      : requestedDate || (opensOnToday ? today : undefined);
  const status = first(params.status);
  const searchTerm = first(params.searchTerm);
  const page = Number(first(params.page)) || undefined;

  // The desk also gets today's whole queue, independent of the list's filters
  // and pages, and the owner gets the takings for the day being viewed. Staff
  // run the queue but the API keeps the money figures to owners. Both reads
  // start now, beside the list's, but only the list is awaited here (the
  // toolbar and counts need its meta); the other two stream in on their own.
  const cashDate = date ?? today;
  const queueRead = opensOnToday
    ? getAllAppointments({ date: today, limit: 100 })
    : null;
  const cashRead =
    userRole === "SALON_OWNER" ? getCashSummary({ date: cashDate }) : null;
  const res = await getAllAppointments({ date, status, searchTerm, page });

  return (
    <FilterNavigationProvider>
      <div>
        <Appointments
          appointments={(res?.data ?? []) as any}
          userRole={userRole ?? "GUEST"}
          meta={res?.meta}
          filters={{
            date: date ?? null,
            status: status ?? "ALL",
            searchTerm: searchTerm ?? "",
          }}
          queueSlot={
            queueRead && (
              <Suspense fallback={<QueueSkeleton />}>
                <QueueSection read={queueRead} />
              </Suspense>
            )
          }
          cashSlot={
            cashRead && (
              // Keyed by day: a date change shows this card's skeleton instead
              // of holding the new list back until the takings arrive.
              <Suspense key={cashDate} fallback={<CashSummarySkeleton />}>
                <CashSection date={cashDate} read={cashRead} />
              </Suspense>
            )
          }
        />
      </div>
    </FilterNavigationProvider>
  );
};

export default AppointmentsPage;
