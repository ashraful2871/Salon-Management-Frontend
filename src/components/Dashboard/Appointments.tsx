/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
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
} from "lucide-react";

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
    case "cancelled":
    case "canceled":
      return <Badge variant="destructive">Cancelled</Badge>;
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
  const d = new Date(ymd + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
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
        <div className="flex items-center gap-2 bg-card rounded-lg border p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="px-4 py-2 font-medium">
            {formatDateLabel(selectedDate)}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
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

                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Appointments;
