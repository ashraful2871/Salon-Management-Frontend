/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ListFilter,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatBDT } from "@/lib/money";
import { getStaffBySalon } from "@/services/staff/getStaffBySalon";
import { usePathname } from "next/navigation";
import type {
  Appointment,
  AppointmentStatus,
  PaginationMeta,
} from "@/lib/api-types";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { PendingBar, PendingRegion } from "@/components/Shared/PendingRegion";
import { Skeleton } from "@/components/ui/skeleton";
import { showResultToast } from "@/components/Shared/showResultToast";
import { StatusBadge } from "@/components/Dashboard/appointments/StatusBadge";
import { PaymentBadge } from "@/components/Dashboard/appointments/PaymentBadge";
import { CheckoutDialog } from "@/components/Dashboard/appointments/CheckoutDialog";
import { TokenLookup } from "@/components/Dashboard/appointments/TokenLookup";
import { QueueTabs } from "@/components/Dashboard/appointments/QueueTabs";
import { useAppointmentActions } from "@/components/Dashboard/appointments/useAppointmentActions";
import { PageHeader } from "@/components/Shared/PageHeader";
import { StatCard } from "@/components/Shared/StatCard";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { EmptyState } from "@/components/Shared/EmptyState";
import { toneOf, TONE_CLASSES } from "@/lib/status-tone";

type ApiAppointment = any;

const formatDateLabel = (yyyyMmDd: string) => {
  return new Date(yyyyMmDd + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const toYMD = (iso: string) => {
  // "2026-02-27T00:00:00.000Z" -> "2026-02-27"
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
};

const formatTime12 = (hhmm?: string) => {
  if (!hhmm) return "—";
  const [hhStr, mm] = hhmm.split(":");
  const hh = Number(hhStr);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${mm} ${ampm}`;
};

const todayYMD = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

/**
 * When the appointment actually begins. The backend reads "HH:mm" against the
 * appointment's date in server-local time, so we do the same here - a mismatch
 * would show a Cancel button the API is about to refuse.
 */
const startsAtOf = (ymd: string, hhmm?: string) => {
  if (!ymd || !hhmm) return null;
  const parsed = new Date(`${ymd}T${hhmm.padStart(5, "0")}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (ymd: string, delta: number) => {
  const d = new Date(ymd + "T12:00:00"); // noon to avoid DST/timezone edge cases
  d.setDate(d.getDate() + delta);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
};

type AppointmentFilters = {
  date: string | null; // YYYY-MM-DD, or null for every date
  status: string; // an appointment status, or "ALL"
  searchTerm: string;
};

const Appointments = ({
  appointments = [],
  userRole = "GUEST",
  meta,
  filters = { date: null, status: "ALL", searchTerm: "" },
  queueSlot = null,
  cashSlot = null,
}: {
  appointments: ApiAppointment[];
  userRole?: string;
  meta?: PaginationMeta;
  filters?: AppointmentFilters;
  /** Today's whole queue, streamed in on its own. Salon desk only. */
  queueSlot?: ReactNode;
  /** The day's takings, streamed in on its own. Owners only. */
  cashSlot?: ReactNode;
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  
  // Assign Staff State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [assigningAppointment, setAssigningAppointment] = useState<{ id: string, salonId: string, currentStatus: string } | null>(null);

  // Collect Modal State
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectingAppointment, setCollectingAppointment] =
    useState<Appointment | null>(null);

  const actions = useAppointmentActions();
  const { withPending, isPending } = actions;
  const { navigate } = useFilterNavigation();
  const pathname = usePathname();

  // Filters live in the URL and the server applies them, so a refresh or a
  // shared link lands on the same view and no booking is left off the page.
  const selectedDate = filters.date;
  const statusFilter = filters.status;
  const opensOnToday = userRole === "SALON_OWNER" || userRole === "STAFF";

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

  // Typed locally and sent on Enter; re-synced when the URL changes under it
  // (Clear, the back button).
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [syncedSearch, setSyncedSearch] = useState(filters.searchTerm);
  if (syncedSearch !== filters.searchTerm) {
    setSyncedSearch(filters.searchTerm);
    setSearchInput(filters.searchTerm);
  }

  // The clock the action gating reads. It ticks on its own so a Cancel button
  // disappears the moment the appointment starts, rather than sitting there
  // until the page is next loaded for the customer to click and be refused.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const isCustomer = userRole === "CUSTOMER";

  // The server's rows with any change still in flight laid over them.
  const items = useMemo(
    () => withPending(appointments || []),
    [withPending, appointments],
  );

  const normalized = useMemo(() => {
    const today = todayYMD();

    return items.map((apt) => {
      const date = toYMD(apt.appointmentDate);
      const startsAt = startsAtOf(date, apt?.startTime);
      const name = apt?.customer?.name?.trim();
      const email = apt?.customer?.email?.trim();
      
      let customerName = "Unknown";
      if (name && name !== "User" && name !== "Unknown") {
        customerName = name;
        // If they want email as well, we can append it or just use it as fallback.
        // The user said "if the user name is not applicabble so pleaseshow here the user email as well not the show user demo name"
        // Let's just use email if name is missing or demo-like, else just use name. But actually we can return both.
      } else if (email) {
        customerName = email;
      }
      
      const customerEmail = email || "";

      const serviceName = apt?.service?.name || "Service";
      const duration =
        typeof apt?.service?.duration === "number"
          ? `${apt.service.duration} min`
          : "—";
      const time = formatTime12(apt?.startTime);

      return {
        id: apt.id,
        date,
        customer: customerName,
        customerEmail: customerEmail,
        service: serviceName,
        time,
        duration,
        priceMinor: apt?.totalMinor || 0,
        status: (apt?.status || "PENDING").toLowerCase(),
        rawStatus: apt?.status || "PENDING",
        salonId: apt?.salon?.id,
        salonName: apt?.salon?.name,
        counterName: apt?.counter?.name,
        staffName: apt?.staff?.user?.name,
        token: apt?.token || null,
        serialNumber:
          typeof apt?.serialNumber === "number" ? apt.serialNumber : null,
        // "#5 · Haircut · Counter A": the customer's place in the line.
        serialLine: [
          typeof apt?.serialNumber === "number" ? `#${apt.serialNumber}` : null,
          serviceName,
          apt?.counter?.name,
        ]
          .filter(Boolean)
          .join(" · "),
        // Drives what may be done, not just what is shown: the appointment is
        // over to the customer once it starts, and off the salon's desk on any
        // day but today.
        hasStarted: startsAt ? startsAt.getTime() <= nowMs : false,
        isToday: date === today,
        // Billing figures for the payment badge and checkout, as the server sent them.
        raw: apt as Appointment,
      };
    });
    // `nowMs` ticks so a Cancel button disappears on its own at the start time
    // rather than waiting for the next page load.
  }, [items, nowMs]);

  // Server totals across every page for the current date and search; the
  // status filter is left out of them so each chip shows its own total.
  const statusCounts = meta?.statusCounts ?? {};
  const countOf = (status: AppointmentStatus) => statusCounts[status] ?? 0;
  const totalCount = Object.values(statusCounts).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  );
  const confirmedCount = countOf("CONFIRMED");
  const pendingCount = countOf("PENDING");
  const completedCount = countOf("COMPLETED");

  // Status filter options
  const statusOptions = [
    { label: "All", value: "ALL", count: totalCount },
    { label: "Pending", value: "PENDING", count: pendingCount },
    { label: "Confirmed", value: "CONFIRMED", count: confirmedCount },
    { label: "Checked in", value: "CHECKED_IN", count: countOf("CHECKED_IN") },
    { label: "In Progress", value: "IN_PROGRESS", count: countOf("IN_PROGRESS") },
    { label: "Completed", value: "COMPLETED", count: completedCount },
    { label: "Cancelled", value: "CANCELLED", count: countOf("CANCELLED") },
  ];

  const page = meta?.page ?? 1;
  const limit = meta?.limit || normalized.length || 1;
  const total = meta?.total ?? normalized.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const firstShown = (page - 1) * limit + 1;

  const handleCheckIn = (appointmentId: string) => actions.checkIn(appointmentId);

  // The row shows Cancelled at once (and goes back, with an error toast, if the
  // API refuses), so the dialog has nothing left to wait for.
  const handleCancel = () => {
    if (!cancelId) return;
    setCancelId(null);
    actions.cancel(cancelId);
  };

  const handleOpenAssignModal = async (appointmentId: string, salonId: string, currentStatus: string) => {
    setAssigningAppointment({ id: appointmentId, salonId, currentStatus });
    setAssignModalOpen(true);
    setStaffList([]); // Reset before fetch
    setStaffLoading(true);
    const res = await getStaffBySalon(salonId);
    setStaffLoading(false);
    if (res?.success && res.data) {
      setStaffList(res.data);
    } else {
      showResultToast({ success: false, message: "Failed to fetch staff list" });
    }
  };

  const handleAssignStaff = () => {
    if (!assigningAppointment || !selectedStaff) return;
    const statusToSet = (assigningAppointment.currentStatus === "PENDING" ? "CONFIRMED" : assigningAppointment.currentStatus) as AppointmentStatus;
    const staff = staffList.find((s) => s.id === selectedStaff);
    actions.assign(
      assigningAppointment.id,
      selectedStaff,
      statusToSet,
      staff && { id: staff.id, user: staff.user },
    );
    setAssignModalOpen(false);
    setSelectedStaff("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? "My bookings" : "Appointments"}
        description={
          isCustomer
            ? "Your upcoming and past salon bookings"
            : "Manage your salon appointments"
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Total" value={totalCount} icon={CalendarIcon} />
        <StatCard label="Pending" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Confirmed" value={confirmedCount} icon={User} tone="info" />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* Counter desk: token lookup and the day's takings */}
      {opensOnToday && (
        <div className="space-y-4">
          <TokenLookup />
          {cashSlot}
        </div>
      )}

      <QueueTabs enabled={opensOnToday} queue={queueSlot}>
      {/* Filters Toolbar. Every group wraps as a unit, so nothing is pushed
          past the card edge on a tablet or a narrow laptop. */}
      <div className="relative">
        <Card className="gap-0 py-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Status */}
              <Select
                value={statusFilter}
                onValueChange={(val) => pushFilters({ status: val })}
              >
                <SelectTrigger className="w-full sm:w-48" aria-label="Status">
                  <ListFilter className="text-muted-foreground" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              opt.value === "ALL"
                                ? "bg-foreground"
                                : TONE_CLASSES[toneOf(opt.value)].dot
                            }`}
                          />
                          <span>{opt.label}</span>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {opt.count}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date: a quick pair and a stepper, each wrapping as one piece */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant={selectedDate === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    pushFilters({ date: null });
                    setCalendarOpen(false);
                  }}
                >
                  All dates
                </Button>
                <Button
                  variant={selectedDate === todayYMD() ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    pushFilters({ date: todayYMD() });
                    setCalendarOpen(false);
                  }}
                >
                  Today
                </Button>
              </div>

              <div className="relative flex items-center rounded-full border border-border bg-surface">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Previous day"
                  onClick={() => {
                    const current = selectedDate || new Date().toISOString().slice(0, 10);
                    pushFilters({ date: addDays(current, -1) });
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <button
                  type="button"
                  className={`flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-sm font-medium transition-colors hover:bg-muted ${
                    selectedDate ? "text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setCalendarOpen((v) => !v)}
                  aria-expanded={calendarOpen}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate ? formatDateLabel(selectedDate) : "Pick a date"}
                </button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Next day"
                  onClick={() => {
                    const current = selectedDate || new Date().toISOString().slice(0, 10);
                    pushFilters({ date: addDays(current, 1) });
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Calendar Dropdown */}
                {calendarOpen && (
                  <MiniCalendar
                    selectedDate={selectedDate || new Date().toISOString().slice(0, 10)}
                    onSelect={(date) => {
                      pushFilters({ date });
                      setCalendarOpen(false);
                    }}
                    onClose={() => setCalendarOpen(false)}
                  />
                )}
              </div>

              {/* Search takes what is left, or a line of its own */}
              <form
                className="relative w-full min-w-[220px] sm:w-auto sm:flex-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  pushFilters({ searchTerm: searchInput.trim() });
                }}
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Name, phone or token, then Enter"
                  aria-label="Search bookings"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </form>

              {(statusFilter !== "ALL" || selectedDate !== null || filters.searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchInput("");
                    setCalendarOpen(false);
                    pushFilters({ status: "ALL", date: null, searchTerm: "" });
                  }}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Sits in the gap below the toolbar, so showing it moves nothing. */}
        <PendingBar className="absolute inset-x-4 top-full mt-3" />
      </div>

      {/* Appointments List */}
      <div>
        <PendingRegion>
        <Card className="gap-4">
          <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6">
            <CardTitle>
              {selectedDate ? formatDateLabel(selectedDate) : "All appointments"}
            </CardTitle>
            <span className="shrink-0 text-sm text-muted-foreground">
              {total} appointment{total !== 1 ? "s" : ""}
            </span>
          </CardHeader>

          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3">
              {normalized.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  title="No appointments found"
                  description={
                    statusFilter !== "ALL" || selectedDate !== null || filters.searchTerm
                      ? "Try another date, or clear the filters."
                      : isCustomer
                        ? "Your salon bookings will show up here."
                        : "New bookings will show up here."
                  }
                />
              ) : (
                normalized.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="grid gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/30 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,17rem)] xl:items-center xl:gap-6"
                  >
                    {/* Who and what */}
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-hover sm:size-11">
                        {getInitials(appointment.customer)}
                      </div>

                      <div className="min-w-0 flex-1">
                        {isCustomer ? (
                          // A customer's own name tells them nothing; their
                          // place in the line and the token to quote do.
                          <>
                            <p className="font-semibold leading-snug text-foreground tabular-nums">
                              {appointment.serialLine}
                            </p>
                            {(appointment.salonName || appointment.staffName) && (
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                                {appointment.salonName && (
                                  <span>{appointment.salonName}</span>
                                )}
                                {appointment.salonName && appointment.staffName && (
                                  <span aria-hidden="true" className="size-1 rounded-full bg-border" />
                                )}
                                {appointment.staffName && (
                                  <span className="inline-flex items-center gap-1">
                                    <User className="h-3 w-3" /> {appointment.staffName}
                                  </span>
                                )}
                              </p>
                            )}
                            {appointment.token && (
                              <span className="mt-2 inline-flex h-6 w-fit items-center rounded-md border border-dashed border-primary/40 bg-surface-subtle px-2 font-mono text-[11px] font-semibold tracking-wider text-foreground">
                                {appointment.token}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Queue identity. This is what the customer reads out
                                and what the counter calls, so it sits above the
                                name rather than buried in the detail line. */}
                            {(appointment.token || appointment.serialNumber !== null) && (
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                {appointment.serialNumber !== null && (
                                  <span className="inline-flex h-6 min-w-7 items-center justify-center rounded-md bg-primary-soft px-1.5 text-xs font-bold text-primary-hover tabular-nums">
                                    #{appointment.serialNumber}
                                  </span>
                                )}
                                {appointment.token && (
                                  <span className="inline-flex h-6 items-center rounded-md border border-dashed border-primary/40 bg-surface-subtle px-2 font-mono text-[11px] font-semibold tracking-wider text-foreground">
                                    {appointment.token}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="break-words font-semibold leading-snug text-foreground">
                              {appointment.customer}
                            </p>
                            {appointment.customerEmail && appointment.customerEmail !== appointment.customer && (
                              <p className="truncate text-xs text-muted-foreground">
                                {appointment.customerEmail}
                              </p>
                            )}
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                              <span className="font-medium text-primary-hover">{appointment.service}</span>
                              {appointment.salonName && (
                                <>
                                  <span aria-hidden="true" className="size-1 rounded-full bg-border" />
                                  <span>{appointment.salonName}</span>
                                </>
                              )}
                            </p>

                            {(appointment.staffName || appointment.counterName) && (
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                {appointment.staffName && (
                                  <span className="inline-flex items-center gap-1">
                                    <User className="h-3 w-3" /> {appointment.staffName}
                                  </span>
                                )}
                                {appointment.staffName && appointment.counterName && (
                                  <span aria-hidden="true" className="size-1 rounded-full bg-border" />
                                )}
                                {appointment.counterName && (
                                  <span>Counter: {appointment.counterName}</span>
                                )}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* When and how much */}
                    <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3 xl:flex xl:gap-8 xl:border-0 xl:pt-0">
                      <div className="min-w-0">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Date
                        </dt>
                        <dd className="mt-1 whitespace-nowrap text-sm font-medium text-foreground">
                          {new Date(appointment.date + "T00:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: selectedDate ? undefined : "numeric",
                          })}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Time
                        </dt>
                        <dd className="mt-1 whitespace-nowrap text-sm font-semibold text-foreground tabular-nums">
                          {appointment.time}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {appointment.duration}
                          </span>
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Price
                        </dt>
                        <dd className="mt-1 whitespace-nowrap text-sm font-semibold text-foreground tabular-nums">
                          {formatBDT(appointment.priceMinor)}
                        </dd>
                      </div>
                    </dl>

                    {/* Status and the one thing to do next */}
                    <div className="flex flex-wrap items-center justify-between gap-3 xl:justify-end">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 xl:justify-end">
                        {isCustomer && appointment.rawStatus === "CHECKED_IN" ? (
                          <ToneBadge status="CHECKED_IN" className="whitespace-normal text-left">
                            {"Checked in – you're in the queue"}
                          </ToneBadge>
                        ) : (
                          <StatusBadge status={appointment.rawStatus} />
                        )}
                        <PaymentBadge
                          appointment={appointment.raw}
                          viewer={isCustomer ? "customer" : "owner"}
                        />
                      </div>

                      {/* Status Actions Dropdown.
                          Confirm and Start are gone: a paid booking is
                          confirmed at checkout, and a booking starts itself
                          when its time comes. NO_SHOW shows nothing at all so
                          the automatic forfeiture is left alone. */}
                      {isCustomer
                        ? // Only a booking nobody has acted on yet can be
                          // cancelled; from check-in on, the API refuses.
                          !appointment.hasStarted &&
                          (appointment.rawStatus === "PENDING" ||
                            appointment.rawStatus === "CONFIRMED") && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isPending(appointment.id)}
                              className="shrink-0 text-danger hover:bg-danger-soft hover:text-danger"
                              onClick={() => setCancelId(appointment.id)}
                            >
                              {isPending(appointment.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Cancel
                            </Button>
                          )
                        : // The salon works today's book. An upcoming or past
                          // appointment is not something to act on from here.
                          appointment.isToday &&
                          appointment.rawStatus !== "COMPLETED" &&
                          appointment.rawStatus !== "CANCELLED" &&
                          appointment.rawStatus !== "NO_SHOW" &&
                          (userRole === "SALON_OWNER" ||
                            appointment.rawStatus !== "PENDING") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0"
                                  disabled={isPending(appointment.id)}
                                >
                                  {isPending(appointment.id) && (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                  )}
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {appointment.rawStatus === "CONFIRMED" && (
                                  <DropdownMenuItem
                                    onClick={() => handleCheckIn(appointment.id)}
                                  >
                                    <User className="mr-2 h-4 w-4 text-info" />
                                    Check in
                                  </DropdownMenuItem>
                                )}
                                {/* A pending booking has no reserved slot to
                                    complete; the API only checks out from
                                    Confirmed onwards. */}
                                {appointment.rawStatus !== "PENDING" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCollectingAppointment(appointment.raw);
                                      setCollectModalOpen(true);
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                    {(appointment.raw.amountDueMinor ?? 0) > 0
                                      ? `Complete & collect ${formatBDT(appointment.raw.amountDueMinor)}`
                                      : "Complete"}
                                  </DropdownMenuItem>
                                )}
                                {userRole === "SALON_OWNER" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenAssignModal(
                                        appointment.id,
                                        appointment.salonId,
                                        appointment.rawStatus,
                                      )
                                    }
                                  >
                                    <User className="mr-2 h-4 w-4 text-info" />
                                    Assign Staff
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {normalized.length > 0
                    ? `Showing ${firstShown}–${firstShown + normalized.length - 1} of ${total}`
                    : `Page ${page} of ${totalPages}`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => pushFilters({ page: page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => pushFilters({ page: page + 1 })}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </PendingRegion>
      </div>
      </QueueTabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
      >
        <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-2xl p-0">
          <div className="p-6 pb-4 border-b bg-destructive/5 shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Cancel Appointment
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Are you sure you want to cancel this appointment? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-background flex justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelId(null)}
            >
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              className="text-white"
            >
              Cancel Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog
        open={assignModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssignModalOpen(false);
            setSelectedStaff("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-2xl p-0">
          <div className="p-6 pb-4 border-b shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl">Assign Staff</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Select a staff member to assign to this appointment.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-background space-y-4 shrink-0">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Staff</label>
              {staffLoading ? (
                <div aria-busy="true" aria-label="Loading staff" className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.user?.name || "Unknown"} ({staff.designation || "Staff"})
                    </SelectItem>
                  ))}
                  {staffList.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No staff found
                    </div>
                  )}
                </SelectContent>
              </Select>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-primary text-white"
                onClick={handleAssignStaff}
                disabled={!selectedStaff}
              >
                Assign Staff
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete & Collect Dialog */}
      <CheckoutDialog
        appointment={collectingAppointment}
        open={collectModalOpen}
        onOpenChange={(open) => {
          setCollectModalOpen(open);
          if (!open) setCollectingAppointment(null);
        }}
        complete={actions.complete}
      />
    </div>
  );
};

/* ---------- Mini Calendar Dropdown ---------- */

function MiniCalendar({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: string;
  onSelect: (ymd: string) => void;
  onClose: () => void;
}) {
  const [year, month] = selectedDate.split("-").map(Number);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month); // 1-indexed

  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // First day of the viewed month (0=Sun..6=Sat)
  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const monthName = new Date(viewYear, viewMonth - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const dayYmd = (day: number) => {
    return `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  return (
    <>
      {/* Backdrop to close on outside click */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute top-full left-0 mt-2 z-50 bg-card border rounded-xl shadow-lg p-4 w-[320px] animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Month/Year Header */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">{monthName}</span>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ymd = dayYmd(day);
            const isSelected = ymd === selectedDate;
            const isToday = ymd === todayYmd;

            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelect(ymd)}
                className={`
                  h-9 w-full rounded-lg text-sm font-medium transition-all
                  flex items-center justify-center cursor-pointer
                  ${isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isToday
                      ? "bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                      : "hover:bg-muted text-foreground"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Quick jump to today */}
        <div className="mt-3 pt-3 border-t flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary"
            onClick={() => onSelect(todayYmd)}
          >
            Jump to Today
          </Button>
        </div>
      </div>
    </>
  );
}

export default Appointments;
