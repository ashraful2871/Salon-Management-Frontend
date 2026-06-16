/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Play,
  AlertTriangle,
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
import { updateAppointmentStatus } from "@/services/appoinments/updateAppointmentStatus";
import { cancelAppointment } from "@/services/appoinments/cancelAppointment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ApiAppointment = any;

const getStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase();

  switch (s) {
    case "confirmed":
      return (
        <Badge className="bg-sage text-accent-foreground text-white">
          Confirmed
        </Badge>
      );
    case "in_progress":
    case "in-progress":
      return (
        <Badge className="bg-gold text-primary-foreground">In Progress</Badge>
      );
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "completed":
      return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
    case "cancelled":
    case "canceled":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "no_show":
      return <Badge variant="destructive">No Show</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

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

const Appointments = ({
  appointments = [],
}: {
  appointments: ApiAppointment[];
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // ✅ pick default selectedDate from API (if exists) else today
  const defaultDate = useMemo(() => {
    const first = appointments?.[0]?.appointmentDate;
    if (first) return toYMD(first);
    return new Date().toISOString().slice(0, 10);
  }, [appointments]);

  const [selectedDate, setSelectedDate] = useState(defaultDate);

  // ✅ normalize API -> UI
  const normalized = useMemo(() => {
    return (appointments || []).map((apt) => {
      const date = toYMD(apt.appointmentDate);
      const customerName = apt?.customer?.name || "Unknown";
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
        service: serviceName,
        time,
        duration,
        status: (apt?.status || "PENDING").toLowerCase(), // for badge
        rawStatus: apt?.status || "PENDING",
        salonName: apt?.salon?.name,
        counterName: apt?.counter?.name,
        staffName: apt?.staff?.user?.name,
      };
    });
  }, [appointments]);

  const filteredAppointments = normalized.filter((apt) => {
    const matchesDate = apt.date === selectedDate;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      apt.customer.toLowerCase().includes(q) ||
      apt.service.toLowerCase().includes(q) ||
      (apt.salonName || "").toLowerCase().includes(q) ||
      (apt.staffName || "").toLowerCase().includes(q);
    return matchesDate && matchesSearch;
  });

  // ✅ stats based on selected date (more useful)
  const todayAppointments = normalized.filter(
    (a) => a.date === selectedDate,
  ).length;
  const confirmedCount = normalized.filter(
    (a) => a.rawStatus === "CONFIRMED",
  ).length;
  const pendingCount = normalized.filter(
    (a) => a.rawStatus === "PENDING",
  ).length;

  const handleStatusUpdate = (appointmentId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateAppointmentStatus(appointmentId, newStatus);
      if (res?.success) {
        toast.success(`Appointment ${newStatus.toLowerCase().replace("_", " ")} successfully`);
        router.refresh();
      } else {
        toast.error(res?.message || "Failed to update status");
      }
    });
  };

  const handleCancel = () => {
    if (!cancelId) return;
    startTransition(async () => {
      const res = await cancelAppointment(cancelId);
      if (res?.success) {
        toast.success("Appointment cancelled successfully");
        setCancelId(null);
        router.refresh();
      } else {
        toast.error(res?.message || "Failed to cancel appointment");
        setCancelId(null);
      }
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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today", value: todayAppointments, icon: CalendarIcon },
          { label: "Confirmed", value: confirmedCount, icon: Clock },
          { label: "Pending", value: pendingCount, icon: User },
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

      {/* Date Navigation & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="flex items-center gap-2 bg-card rounded-lg border p-2 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <button
            type="button"
            className="px-4 py-2 font-medium hover:bg-muted rounded-md transition-colors flex items-center gap-2 cursor-pointer"
            onClick={() => setCalendarOpen((v) => !v)}
          >
            <CalendarIcon className="h-4 w-4 text-primary" />
            {formatDateLabel(selectedDate)}
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Today button */}
          <Button
            variant="outline"
            size="sm"
            className="ml-1 text-xs"
            onClick={() => {
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, "0");
              const dd = String(today.getDate()).padStart(2, "0");
              setSelectedDate(`${yyyy}-${mm}-${dd}`);
              setCalendarOpen(false);
            }}
          >
            Today
          </Button>

          {/* Calendar Dropdown */}
          {calendarOpen && (
            <MiniCalendar
              selectedDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setCalendarOpen(false);
              }}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Appointments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No appointments found for this date.
                </p>
              ) : (
                filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {getInitials(appointment.customer)}
                      </div>

                      <div>
                        <p className="font-medium">{appointment.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.service}
                          {appointment.salonName
                            ? ` • ${appointment.salonName}`
                            : ""}
                        </p>

                        {/* Optional extra line (still clean) */}
                        {(appointment.staffName || appointment.counterName) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {appointment.staffName
                              ? `Staff: ${appointment.staffName}`
                              : ""}
                            {appointment.staffName && appointment.counterName
                              ? " • "
                              : ""}
                            {appointment.counterName
                              ? `Counter: ${appointment.counterName}`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6">
                      <div className="text-right">
                        <p className="font-medium">{appointment.time}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.duration}
                        </p>
                      </div>

                      {getStatusBadge(appointment.rawStatus)}

                      {/* Status Actions Dropdown */}
                      {appointment.rawStatus !== "COMPLETED" &&
                        appointment.rawStatus !== "CANCELLED" && (
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
                              {appointment.rawStatus === "PENDING" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(
                                      appointment.id,
                                      "CONFIRMED"
                                    )
                                  }
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-sage" />
                                  Confirm
                                </DropdownMenuItem>
                              )}
                              {(appointment.rawStatus === "PENDING" ||
                                appointment.rawStatus === "CONFIRMED") && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(
                                      appointment.id,
                                      "IN_PROGRESS"
                                    )
                                  }
                                >
                                  <Play className="mr-2 h-4 w-4 text-gold" />
                                  Start
                                </DropdownMenuItem>
                              )}
                              {appointment.rawStatus === "IN_PROGRESS" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(
                                      appointment.id,
                                      "COMPLETED"
                                    )
                                  }
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                  Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setCancelId(appointment.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
