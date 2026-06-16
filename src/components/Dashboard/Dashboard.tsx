/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  MoreHorizontal,
  TrendingUp,
  Users,
  Store,
  Package,
} from "lucide-react";
import Link from "next/link";

const getStatusColor = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "confirmed":
      return "bg-sage text-accent-foreground  text-white";
    case "in_progress":
    case "in-progress":
      return "bg-gold text-primary-foreground";
    case "pending":
      return "bg-secondary text-secondary-foreground";
    case "completed":
      return "bg-primary text-primary-foreground";
    case "cancelled":
    case "canceled":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatTime12 = (hhmm?: string) => {
  if (!hhmm) return "—";
  const [hhStr, mm] = hhmm.split(":");
  const hh = Number(hhStr);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${mm} ${ampm}`;
};

const Dashboard = ({
  dashboardData,
  userRole,
}: {
  dashboardData: any;
  userRole: string;
}) => {
  // Build stats based on role
  const stats = buildStats(dashboardData, userRole);
  const recentAppointments = dashboardData?.recentAppointments || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here is what is happening today.
          </p>
        </div>
        <Link href="/dashboard/appointments">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            View Schedule
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any, index: number) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <stat.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  {stat.change && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        stat.trend === "up" ? "text-sage" : "text-destructive"
                      }`}
                    >
                      <TrendingUp
                        className={`h-4 w-4 ${
                          stat.trend === "down" ? "rotate-180" : ""
                        }`}
                      />
                      {stat.change}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Appointments</CardTitle>
              <Link href="/dashboard/appointments">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAppointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No recent appointments.
                  </p>
                ) : (
                  recentAppointments.slice(0, 5).map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {(appointment.customer?.name || "U")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium">
                            {appointment.customer?.name || "Customer"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.service?.name || "Service"}
                            {appointment.salon?.name
                              ? ` • ${appointment.salon.name}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {appointment.startTime
                            ? formatTime12(appointment.startTime)
                            : "—"}
                        </span>
                        <Badge
                          className={getStatusColor(appointment.status || "")}
                        >
                          {(appointment.status || "PENDING").replace("_", " ")}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointment Status Breakdown (for owners/admins) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {userRole === "CUSTOMER"
                  ? "Your Summary"
                  : "Appointment Status"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.appointmentsByStatus?.length > 0 ? (
                  <>
                    {dashboardData.appointmentsByStatus.map(
                      (item: any, index: number) => {
                        const statusLabel = (item.status || "")
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c: string) => c.toUpperCase());
                        const statusColor =
                          item.status === "COMPLETED"
                            ? "bg-primary text-primary-foreground"
                            : item.status === "CONFIRMED"
                              ? "bg-sage text-white"
                              : item.status === "IN_PROGRESS"
                                ? "bg-gold text-primary-foreground"
                                : item.status === "CANCELLED"
                                  ? "bg-destructive text-destructive-foreground"
                                  : "bg-secondary text-secondary-foreground";

                        return (
                          <div
                            key={item.status || index}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <Badge className={statusColor}>
                                {statusLabel}
                              </Badge>
                            </div>
                            <span className="font-bold text-lg">
                              {item._count}
                            </span>
                          </div>
                        );
                      }
                    )}

                    {/* Show total spent for customers */}
                    {userRole === "CUSTOMER" &&
                      dashboardData?.totalSpent !== undefined && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border-t mt-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Total Spent
                          </span>
                          <span className="font-bold text-gold">
                            ${dashboardData.totalSpent || 0}
                          </span>
                        </div>
                      )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No appointment data available yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

function buildStats(data: any, role: string) {
  if (!data) {
    return [
      {
        title: "Appointments",
        value: "0",
        icon: Calendar,
        color: "bg-gradient-rose",
      },
      {
        title: "Revenue",
        value: "$0",
        icon: DollarSign,
        color: "bg-gradient-gold",
      },
    ];
  }

  if (role === "ADMIN") {
    return [
      {
        title: "Total Users",
        value: data.totalUsers?.toLocaleString() || "0",
        icon: Users,
        color: "bg-sage",
      },
      {
        title: "Total Salons",
        value: data.totalSalons?.toLocaleString() || "0",
        icon: Store,
        color: "bg-gradient-rose",
      },
      {
        title: "Total Appointments",
        value: data.totalAppointments?.toLocaleString() || "0",
        icon: Calendar,
        color: "bg-primary",
      },
      {
        title: "Total Revenue",
        value: `$${(data.totalRevenue || 0).toLocaleString()}`,
        icon: DollarSign,
        color: "bg-gradient-gold",
      },
    ];
  }

  if (role === "SALON_OWNER") {
    return [
      {
        title: "Today's Appointments",
        value: data.todayAppointments?.toLocaleString() || "0",
        icon: Calendar,
        color: "bg-gradient-rose",
      },
      {
        title: "Total Appointments",
        value: data.totalAppointments?.toLocaleString() || "0",
        icon: Clock,
        color: "bg-primary",
      },
      {
        title: "Pending",
        value: data.pendingAppointments?.toLocaleString() || "0",
        icon: Users,
        color: "bg-sage",
        change: data.pendingAppointments > 0 ? `${data.pendingAppointments} awaiting` : undefined,
        trend: "up",
      },
      {
        title: "Revenue",
        value: `$${(data.totalRevenue || 0).toLocaleString()}`,
        icon: DollarSign,
        color: "bg-gradient-gold",
      },
    ];
  }

  // CUSTOMER
  return [
    {
      title: "Total Appointments",
      value: data.totalAppointments?.toLocaleString() || "0",
      icon: Calendar,
      color: "bg-gradient-rose",
    },
    {
      title: "Completed",
      value: data.completedAppointments?.toLocaleString() || "0",
      icon: Clock,
      color: "bg-sage",
    },
    {
      title: "Upcoming",
      value: data.upcomingAppointments?.toLocaleString() || "0",
      icon: Calendar,
      color: "bg-primary",
    },
    {
      title: "Total Spent",
      value: `$${(data.totalSpent || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-gradient-gold",
    },
  ];
}

export default Dashboard;
