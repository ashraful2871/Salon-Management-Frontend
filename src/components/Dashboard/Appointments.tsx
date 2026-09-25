/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  ListFilter,
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
import { updateAppointmentStatus } from "@/services/appoinments/updateAppointmentStatus";
import { cancelAppointment } from "@/services/appoinments/cancelAppointment";
import { getStaffBySalon } from "@/services/staff/getStaffBySalon";
import { checkInAppointment } from "@/services/appoinments/checkInAppointment";
import { usePathname, useRouter } from "next/navigation";
import type {
  Appointment,
  AppointmentStatus,
  CashSummary as CashSummaryData,
  PaginationMeta,
} from "@/lib/api-types";
import { showResultToast } from "@/components/Shared/showResultToast";
import { StatusBadge } from "@/components/Dashboard/appointments/StatusBadge";
import { PaymentBadge } from "@/components/Dashboard/appointments/PaymentBadge";
import { CheckoutDialog } from "@/components/Dashboard/appointments/CheckoutDialog";
import { TokenLookup } from "@/components/Dashboard/appointments/TokenLookup";
import { CashSummary } from "@/components/Dashboard/appointments/CashSummary";
import { TodayQueue } from "@/components/Dashboard/appointments/TodayQueue";
import { QueueTabs } from "@/components/Dashboard/appointments/QueueTabs";

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
  queue = [],
  cashSummary = null,
  cashDate = null,
}: {
  appointments: ApiAppointment[];
  userRole?: string;
  meta?: PaginationMeta;
  filters?: AppointmentFilters;
  /** Every booking today, unpaginated. Salon desk only. */
  queue?: Appointment[];
  cashSummary?: CashSummaryData | null;
  cashDate?: string | null;
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  
  // Assign Staff State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [assigningAppointment, setAssigningAppointment] = useState<{ id: string, salonId: string, currentStatus: string } | null>(null);

  // Collect Modal State
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectingAppointment, setCollectingAppointment] =
    useState<Appointment | null>(null);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();
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
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  // Typed locally and sent on Enter; re-synced when the URL changes under it
  // (Clear, the back button).
  const [searchInput, setSearchInput] = useState(filters.searchTerm);
  const [syncedSearch, setSyncedSearch] = useState(filters.searchTerm);
  if (syncedSearch !== filters.searchTerm) {
    setSyncedSearch(filters.searchTerm);
    setSearchInput(filters.searchTerm);
  }

  // ✅ Auto-polling: refresh data every 15 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);

  // The clock the action gating reads. It ticks on its own so a Cancel button
  // disappears the moment the appointment starts, rather than sitting there
  // until the next poll for the customer to click and be refused.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const isCustomer = userRole === "CUSTOMER";

  const normalized = useMemo(() => {
    const today = todayYMD();

    return (appointments || []).map((apt) => {
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
    // rather than waiting for the next poll.
  }, [appointments, nowMs]);

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

  const handleCheckIn = (appointmentId: string) => {
    startTransition(async () => {
      const res = await checkInAppointment(appointmentId);
      showResultToast(res, "Checked in", "Failed to check in");
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (!cancelId) return;
    startTransition(async () => {
      const res = await cancelAppointment(cancelId);
      showResultToast(res, "Appointment cancelled successfully", "Failed to cancel appointment");
      setCancelId(null);
      router.refresh();
    });
  };

  const handleOpenAssignModal = async (appointmentId: string, salonId: string, currentStatus: string) => {
    setAssigningAppointment({ id: appointmentId, salonId, currentStatus });
    setAssignModalOpen(true);
    setStaffList([]); // Reset before fetch
    const res = await getStaffBySalon(salonId);
    if (res?.success && res.data) {
      setStaffList(res.data);
    } else {
      showResultToast({ success: false, message: "Failed to fetch staff list" });
    }
  };

  const handleAssignStaff = () => {
    if (!assigningAppointment || !selectedStaff) return;
    startTransition(async () => {
      const statusToSet = assigningAppointment.currentStatus === "PENDING" ? "CONFIRMED" : assigningAppointment.currentStatus;
      const res = await updateAppointmentStatus(assigningAppointment.id, statusToSet, selectedStaff);
      showResultToast(res, "Staff assigned successfully", "Failed to assign staff");
      setAssignModalOpen(false);
      setSelectedStaff("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your salon appointments
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: totalCount, icon: CalendarIcon },
          { label: "Pending", value: pendingCount, icon: Clock },
          { label: "Confirmed", value: confirmedCount, icon: User },
          { label: "Completed", value: completedCount, icon: CheckCircle2 },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Counter desk: token lookup and the day's takings */}
      {opensOnToday && (
        <div className="space-y-4">
          <TokenLookup />
          {cashSummary && cashDate && (
            <CashSummary summary={cashSummary} date={cashDate} />
          )}
        </div>
      )}

      <QueueTabs enabled={opensOnToday} queue={<TodayQueue appointments={queue} />}>
      {/* Filters Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Status Dropdown */}
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={statusFilter}
                  onValueChange={(val) => pushFilters({ status: val })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                opt.value === "ALL"
                                  ? "bg-foreground"
                                  : opt.value === "PENDING"
                                    ? "bg-yellow-500"
                                    : opt.value === "CONFIRMED"
                                      ? "bg-emerald-500"
                                      : opt.value === "IN_PROGRESS"
                                        ? "bg-amber-500"
                                        : opt.value === "COMPLETED"
                                          ? "bg-primary"
                                          : "bg-destructive"
                              }`}
                            />
                            <span>{opt.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {opt.count}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px bg-border" />

              {/* Date Navigation */}
              <div className="flex items-center gap-1 relative">
                <Button
                  variant={selectedDate === null ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    pushFilters({ date: null });
                    setCalendarOpen(false);
                  }}
                >
                  All Dates
                </Button>

                <div className="h-6 w-px bg-border mx-1" />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const current = selectedDate || new Date().toISOString().slice(0, 10);
                    pushFilters({ date: addDays(current, -1) });
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm font-medium hover:bg-muted rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
                    selectedDate ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setCalendarOpen((v) => !v)}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate ? formatDateLabel(selectedDate) : "Select Date"}
                </button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const current = selectedDate || new Date().toISOString().slice(0, 10);
                    pushFilters({ date: addDays(current, 1) });
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    pushFilters({ date: todayYMD() });
                    setCalendarOpen(false);
                  }}
                >
                  Today
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

              {/* Divider */}
              <div className="hidden lg:block w-px bg-border" />

              {/* Search */}
              <form
                className="relative flex-1 min-w-[200px]"
                onSubmit={(e) => {
                  e.preventDefault();
                  pushFilters({ searchTerm: searchInput.trim() });
                }}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Name, phone or token, then Enter"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9"
                />
              </form>

              {/* Clear Filters */}
              {(statusFilter !== "ALL" || selectedDate !== null || filters.searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchInput("");
                    setCalendarOpen(false);
                    pushFilters({ status: "ALL", date: null, searchTerm: "" });
                  }}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Active filters summary */}
            {(statusFilter !== "ALL" || selectedDate !== null) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {statusFilter !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-destructive/10"
                    onClick={() => pushFilters({ status: "ALL" })}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                        statusFilter === "PENDING"
                          ? "bg-yellow-500"
                          : statusFilter === "CONFIRMED"
                            ? "bg-emerald-500"
                            : statusFilter === "IN_PROGRESS"
                              ? "bg-amber-500"
                              : statusFilter === "COMPLETED"
                                ? "bg-primary"
                                : "bg-destructive"
                      }`}
                    />
                    {statusOptions.find((o) => o.value === statusFilter)?.label}
                    <XCircle className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {selectedDate && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-destructive/10"
                    onClick={() => pushFilters({ date: null })}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {formatDateLabel(selectedDate)}
                    <XCircle className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {selectedDate ? formatDateLabel(selectedDate) : "All Appointments"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {total} appointment{total !== 1 ? "s" : ""}
            </span>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {normalized.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No appointments found.
                </p>
              ) : (
                normalized.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="group flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-gold font-bold text-white shadow-gold transition-transform group-hover:scale-105">
                        {getInitials(appointment.customer)}
                      </div>

                      <div className="flex flex-col">
                        {isCustomer ? (
                          // A customer's own name tells them nothing; their
                          // place in the line and the token to quote do.
                          <>
                            <p className="font-semibold text-base text-foreground leading-none mb-1.5 tabular-nums">
                              {appointment.serialLine}
                            </p>
                            {(appointment.salonName || appointment.staffName) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                {appointment.salonName && (
                                  <span>{appointment.salonName}</span>
                                )}
                                {appointment.salonName && appointment.staffName && (
                                  <span className="h-1 w-1 rounded-full bg-border" />
                                )}
                                {appointment.staffName && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" /> {appointment.staffName}
                                  </span>
                                )}
                              </div>
                            )}
                            {appointment.token && (
                              <span className="mt-2 inline-flex w-fit items-center h-6 px-2 rounded-md border border-dashed border-primary/40 bg-muted/40 text-[11px] font-mono font-semibold tracking-wider text-foreground">
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
                              <div className="flex items-center gap-2 mb-2">
                                {appointment.serialNumber !== null && (
                                  <span className="inline-flex items-center justify-center min-w-7 h-6 px-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold tabular-nums">
                                    #{appointment.serialNumber}
                                  </span>
                                )}
                                {appointment.token && (
                                  <span className="inline-flex items-center h-6 px-2 rounded-md border border-dashed border-primary/40 bg-muted/40 text-[11px] font-mono font-semibold tracking-wider text-foreground">
                                    {appointment.token}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="font-semibold text-base text-foreground leading-none mb-1.5">{appointment.customer}</p>
                            {appointment.customerEmail && appointment.customerEmail !== appointment.customer && (
                              <p className="text-xs text-muted-foreground/80 mb-1 leading-none">{appointment.customerEmail}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                              <span className="font-medium text-primary/80">{appointment.service}</span>
                              {appointment.salonName && (
                                <>
                                  <span className="h-1 w-1 rounded-full bg-border" />
                                  <span>{appointment.salonName}</span>
                                </>
                              )}
                            </div>

                            {/* Optional extra line (still clean) */}
                            {(appointment.staffName || appointment.counterName) && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                                {appointment.staffName && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" /> {appointment.staffName}
                                  </span>
                                )}
                                {appointment.staffName && appointment.counterName && (
                                  <span className="h-1 w-1 rounded-full bg-border" />
                                )}
                                {appointment.counterName && (
                                  <span>Counter: {appointment.counterName}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side data & actions */}
                    <div className="flex flex-col md:flex-row items-end md:items-center justify-between md:justify-end gap-4 md:gap-8 border-t md:border-t-0 pt-4 md:pt-0 mt-3 md:mt-0 w-full md:w-auto">
                      
                      {/* Info grid */}
                      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 sm:gap-8 text-right">
                        {/* Show date when viewing all dates */}
                        {!selectedDate && (
                          <div className="hidden sm:block">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                              Date
                            </p>
                            <p className="text-sm font-medium text-foreground leading-none">
                              {new Date(appointment.date + "T00:00:00").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Time
                          </p>
                          <div className="flex items-baseline justify-end gap-1.5">
                            <p className="text-sm font-bold tabular-nums text-foreground leading-none">{appointment.time}</p>
                            <p className="text-[11px] font-medium text-muted-foreground tabular-nums leading-none">
                              {appointment.duration}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Price
                          </p>
                          <p className="text-sm font-bold tabular-nums text-foreground leading-none">
                            {formatBDT(appointment.priceMinor)}
                          </p>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {isCustomer && appointment.rawStatus === "CHECKED_IN" ? (
                            <Badge className="bg-sky-600 text-white">
                              {"Checked in – you're in the queue"}
                            </Badge>
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
                                disabled={isPending}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setCancelId(appointment.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
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
                                    disabled={isPending}
                                  >
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {appointment.rawStatus === "CONFIRMED" && (
                                    <DropdownMenuItem
                                      onClick={() => handleCheckIn(appointment.id)}
                                    >
                                      <User className="mr-2 h-4 w-4 text-sky-600" />
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
                                      <User className="mr-2 h-4 w-4 text-blue-500" />
                                      Assign Staff
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                      </div>
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
      </motion.div>
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
              disabled={isPending}
            >
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
              className="text-white"
            >
              {isPending ? "Cancelling..." : "Cancel Appointment"}
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
                      No staff found or loading...
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignModalOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-primary text-white"
                onClick={handleAssignStaff}
                disabled={isPending || !selectedStaff}
              >
                {isPending ? "Assigning..." : "Assign Staff"}
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
