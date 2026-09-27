"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, SearchX, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  Appointment,
  AppointmentStatus,
  PaginationMeta,
} from "@/lib/api-types";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { PageHeader } from "@/components/Shared/PageHeader";
import { StatCard } from "@/components/Shared/StatCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import { DataList } from "@/components/Shared/DataList";
import Pagination from "@/components/Shared/Pagination";
import { TokenLookup } from "@/components/Dashboard/appointments/TokenLookup";
import { QueueTabs } from "@/components/Dashboard/appointments/QueueTabs";
import { useAppointmentActions } from "@/components/Dashboard/appointments/useAppointmentActions";
import {
  AppointmentsToolbar,
  type AppointmentFilters,
} from "@/components/Dashboard/appointments/AppointmentsToolbar";
import {
  CustomerRowActions,
  SalonRowActions,
  customerCanCancel,
  customerColumns,
  salonColumns,
  toAppointmentRow,
} from "@/components/Dashboard/appointments/AppointmentRow";
import { useBookingDialogs } from "@/components/Dashboard/appointments/useBookingDialogs";
import { dhakaToday, formatDay } from "@/components/Dashboard/appointments/format";

const STATUS_CHIPS: { value: "ALL" | AppointmentStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CHECKED_IN", label: "Checked in" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const Appointments = ({
  appointments = [],
  userRole = "GUEST",
  meta,
  filters = { date: null, status: "ALL", searchTerm: "" },
  queueSlot = null,
  cashSlot = null,
}: {
  appointments: Appointment[];
  userRole?: string;
  meta?: PaginationMeta;
  filters?: AppointmentFilters;
  /** Today's whole queue, streamed in on its own. Salon desk only. */
  queueSlot?: ReactNode;
  /** The day's takings, streamed in on its own. Owners only. */
  cashSlot?: ReactNode;
}) => {
  const actions = useAppointmentActions();
  const { withPending } = actions;
  const { navigate, isPending } = useFilterNavigation();
  const pathname = usePathname();

  const isCustomer = userRole === "CUSTOMER";
  const opensOnToday = userRole === "SALON_OWNER" || userRole === "STAFF";
  const selectedDate = filters.date;

  // Filters live in the URL and the server applies them, so a refresh or a
  // shared link lands on the same view and no booking is left off the page.
  const pushFilters = (
    patch: Partial<AppointmentFilters> & { page?: number },
  ) => {
    const next = { ...filters, page: 1, ...patch };
    const params = new URLSearchParams();
    // The salon side defaults to today, so "every date" has to be spelled out.
    if (next.date) params.set("date", next.date);
    else if (opensOnToday) params.set("date", "all");
    if (next.status !== "ALL") params.set("status", next.status);
    if (next.searchTerm) params.set("searchTerm", next.searchTerm);
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    // In a transition: the current list stays up, dimmed, until the new one
    // is ready, rather than the route falling back to its skeleton.
    navigate(qs ? `${pathname}?${qs}` : pathname);
  };
  const clearFilters = () => pushFilters({ status: "ALL", searchTerm: "" });

  // The clock the action gating reads. It ticks on its own so a Cancel button
  // disappears the moment the appointment starts, rather than sitting there
  // until the page is next loaded for the customer to click and be refused.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const today = dhakaToday();
  // The server's rows with any change still in flight laid over them.
  const rows = useMemo(
    () => withPending(appointments).map((a) => toAppointmentRow(a, nowMs, today)),
    [withPending, appointments, nowMs, today],
  );

  const { openCancel, openAssign, openView, dialogs } = useBookingDialogs({
    actions,
    rows,
    isCustomer,
  });

  // Server totals across every page for the current date and search; the
  // status filter is left out of them so each chip shows its own total.
  const statusCounts = meta?.statusCounts;
  const countOf = (status: AppointmentStatus) => statusCounts?.[status] ?? 0;
  const dayTotal = statusCounts
    ? Object.values(statusCounts).reduce((sum, n) => sum + (n ?? 0), 0)
    : (meta?.total ?? rows.length);
  const statusOptions = STATUS_CHIPS.map((chip) => ({
    ...chip,
    count: !statusCounts
      ? undefined
      : chip.value === "ALL"
        ? dayTotal
        : countOf(chip.value),
  }));

  const page = meta?.page ?? 1;
  const limit = meta?.limit || rows.length || 1;
  const total = meta?.total ?? rows.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const dayLabel = selectedDate ? formatDay(selectedDate) : "All dates";
  const filtered = filters.status !== "ALL" || Boolean(filters.searchTerm);

  const empty = (
    <div className="rounded-2xl border border-border bg-surface">
      {filtered ? (
        <EmptyState
          icon={SearchX}
          title="No results"
          description={`Nothing matches these filters ${
            selectedDate ? `on ${dayLabel}` : "on any date"
          }.`}
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : selectedDate ? (
        <EmptyState
          icon={CalendarDays}
          title={`No appointments on ${dayLabel}`}
          description="Pick another day, or see every booking."
          action={
            <Button variant="outline" onClick={() => pushFilters({ date: null })}>
              Show all dates
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={CalendarDays}
          title={isCustomer ? "No bookings yet" : "No appointments yet"}
          description={
            isCustomer
              ? "Your salon bookings will show up here."
              : "New bookings will show up here."
          }
          action={
            isCustomer && (
              <Button asChild>
                <Link href="/salons">Find a salon</Link>
              </Button>
            )
          }
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? "My bookings" : "Appointments"}
        description={`${dayLabel} · ${plural(dayTotal, "booking")}`}
      />

      {!isCustomer && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard label="Total" value={dayTotal} icon={CalendarDays} />
          <StatCard label="Pending" value={countOf("PENDING")} icon={Clock} tone="warning" />
          <StatCard label="Confirmed" value={countOf("CONFIRMED")} icon={User} tone="info" />
          <StatCard
            label="Completed"
            value={countOf("COMPLETED")}
            icon={CheckCircle2}
            tone="success"
          />
        </div>
      )}

      {/* Counter desk: token lookup and the day's takings */}
      {opensOnToday && (
        <div className="space-y-4">
          <TokenLookup />
          {cashSlot}
        </div>
      )}

      <QueueTabs enabled={opensOnToday} queue={queueSlot}>
        <AppointmentsToolbar
          filters={filters}
          statusOptions={statusOptions}
          onChange={pushFilters}
        />

        <PendingRegion className="space-y-4">
          <DataList
            items={rows}
            rowKey={(r) => r.id}
            columns={
              isCustomer
                ? customerColumns({ today })
                : salonColumns({ showDate: !selectedDate, today })
            }
            // The salon table has eight columns; below 56rem it reads better as cards.
            tableFrom={isCustomer ? "3xl" : "4xl"}
            caption={isCustomer ? "My bookings" : "Appointments"}
            empty={empty}
            rowActions={(row, layout) =>
              isCustomer ? (
                customerCanCancel(row) ? (
                  <CustomerRowActions row={row} onCancel={openCancel} />
                ) : null
              ) : (
                <SalonRowActions
                  row={row}
                  layout={layout}
                  role={userRole}
                  actions={actions}
                  onAssign={openAssign}
                  onCancel={openCancel}
                  onView={openView}
                />
              )
            }
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(next) => pushFilters({ page: next })}
            disabled={isPending}
            total={total}
            pageSize={limit}
            itemLabel="bookings"
          />
        </PendingRegion>
      </QueueTabs>

      {dialogs}
    </div>
  );
};

export default Appointments;
