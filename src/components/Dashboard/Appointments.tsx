"use client";

import { motion } from "framer-motion";
import { useState } from "react";
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

const appointments = [
  {
    id: 1,
    customer: "Sarah Johnson",
    service: "Haircut & Styling",
    date: "2026-01-03",
    time: "10:00 AM",
    duration: "45 min",
    status: "confirmed",
  },
  {
    id: 2,
    customer: "Emily Chen",
    service: "Color Treatment",
    date: "2026-01-03",
    time: "11:30 AM",
    duration: "2 hours",
    status: "in-progress",
  },
  {
    id: 3,
    customer: "Michael Brown",
    service: "Beard Trim",
    date: "2026-01-03",
    time: "1:00 PM",
    duration: "30 min",
    status: "pending",
  },
  {
    id: 4,
    customer: "Jessica Davis",
    service: "Manicure & Pedicure",
    date: "2026-01-03",
    time: "2:30 PM",
    duration: "1 hour",
    status: "confirmed",
  },
  {
    id: 5,
    customer: "Amanda Wilson",
    service: "Full Spa Package",
    date: "2026-01-04",
    time: "10:00 AM",
    duration: "3 hours",
    status: "confirmed",
  },
  {
    id: 6,
    customer: "David Lee",
    service: "Haircut",
    date: "2026-01-04",
    time: "2:00 PM",
    duration: "30 min",
    status: "pending",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return (
        <Badge className="bg-sage text-accent-foreground text-white">
          Confirmed
        </Badge>
      );
    case "in-progress":
      return (
        <Badge className="bg-gold text-primary-foreground">In Progress</Badge>
      );
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-01-03");

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.date === selectedDate &&
      (apt.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const todayAppointments = appointments.filter(
    (apt) => apt.date === "2026-01-03"
  ).length;
  const confirmedCount = appointments.filter(
    (apt) => apt.status === "confirmed"
  ).length;
  const pendingCount = appointments.filter(
    (apt) => apt.status === "pending"
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
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 font-medium">
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <Button variant="ghost" size="icon">
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
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {appointment.customer
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium">{appointment.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.service}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium">{appointment.time}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.duration}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
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
