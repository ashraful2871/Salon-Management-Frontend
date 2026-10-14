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
import { getSelectedSalonId } from "@/lib/branch-cookie";
import Link from "next/link";
import CashSection from "./CashSection";

/** `?attention=` filters the owner Home links to (same filter as its counts). */
const ATTENTION_LABELS: Record<string, string> = {
  pending: "Waiting for you to confirm",
  stale: "Checked in over 2 hours ago",
  unrecorded: "Completed, payment not recorded",
  appeal: "No-show appeals open",
};
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
  // The owner's branch switcher; undefined is "All branches".
  const salonId =
    userRole === "SALON_OWNER" ? await getSelectedSalonId() : undefined;

  // The salon side works one day at a time, so it opens on today in Dhaka.
  // `date=all` is how the "All Dates" button opts out of that default.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(new Date());
  const requestedDate = first(params.date);
  // A "Needs attention" row on Home: its filter spans every date.
  const attention = ATTENTION_LABELS[first(params.attention) ?? ""] ? first(params.attention) : undefined;
  const opensOnToday = userRole === "SALON_OWNER" || userRole === "STAFF";
  const date =
    requestedDate === "all" || (attention && !requestedDate)
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
    ? getAllAppointments({ date: today, limit: 100, salonId })
    : null;
  const cashRead =
    userRole === "SALON_OWNER" ? getCashSummary({ date: cashDate, salonId }) : null;
  const res = await getAllAppointments({
    date,
    status,
    searchTerm,
    page,
    attention,
    salonId,
  });

  return (
    <FilterNavigationProvider>
      <div>
        {attention && (
          <p className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm">
            <span>
              Showing: <strong>{ATTENTION_LABELS[attention]}</strong>
            </span>
            <Link href="/dashboard/appointments" className="font-medium text-primary underline-offset-4 hover:underline">
              Clear filter
            </Link>
          </p>
        )}
        <Appointments
          appointments={(res?.data ?? []) as any}
          userRole={userRole ?? "GUEST"}
          showBranch={userRole === "SALON_OWNER" && !salonId}
          meta={res?.meta}
          filters={{
            date: date ?? null,
            status: status ?? "ALL",
            searchTerm: searchTerm ?? "",
          }}
          queueSlot={
            queueRead && (
              <Suspense fallback={<QueueSkeleton />}>
                <QueueSection read={queueRead} role={userRole ?? "GUEST"} />
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
