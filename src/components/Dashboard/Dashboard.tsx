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
} from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "$12,450",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "bg-gradient-gold",
  },
  {
    title: "Appointments",
    value: "124",
    change: "+8.2%",
    trend: "up",
    icon: Calendar,
    color: "bg-gradient-rose",
  },
  {
    title: "New Customers",
    value: "48",
    change: "+15.3%",
    trend: "up",
    icon: Users,
    color: "bg-sage",
  },
  {
    title: "Avg. Service Time",
    value: "45 min",
    change: "-5.1%",
    trend: "down",
    icon: Clock,
    color: "bg-primary",
  },
];

const recentAppointments = [
  {
    id: 1,
    customer: "Sarah Johnson",
    service: "Haircut & Styling",
    time: "10:00 AM",
    status: "confirmed",
  },
  {
    id: 2,
    customer: "Emily Chen",
    service: "Color Treatment",
    time: "11:30 AM",
    status: "in-progress",
  },
  {
    id: 3,
    customer: "Michael Brown",
    service: "Beard Trim",
    time: "1:00 PM",
    status: "pending",
  },
  {
    id: 4,
    customer: "Jessica Davis",
    service: "Manicure & Pedicure",
    time: "2:30 PM",
    status: "confirmed",
  },
  {
    id: 5,
    customer: "Amanda Wilson",
    service: "Full Spa Package",
    time: "4:00 PM",
    status: "confirmed",
  },
];

const topServices = [
  { name: "Haircut", bookings: 45, revenue: "$2,250" },
  { name: "Color Treatment", bookings: 32, revenue: "$3,840" },
  { name: "Manicure", bookings: 28, revenue: "$840" },
  { name: "Facial", bookings: 19, revenue: "$1,710" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-sage text-accent-foreground  text-white";
    case "in-progress":
      return "bg-gold text-primary-foreground";
    case "pending":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Dashboard = () => {
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
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Today is Schedule
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
              <CardTitle>Today is Appointments</CardTitle>
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
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
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {appointment.time}
                      </span>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Services */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.bookings} bookings
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-sage">
                      {service.revenue}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
