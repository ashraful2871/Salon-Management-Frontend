/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Package,
  Percent,
  PiggyBank,
  Receipt,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatBDT } from "@/lib/money";
import EarningsTrend from "@/components/Earnings/EarningsTrend";

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

/**
 * Money arrives as poisha under `<name>Minor`. `formatBDT` divides by 100
 * itself, so the taka twin `addTakaFields` adds alongside it must never be the
 * thing that reaches this component — that renders every amount 100x too small.
 */
const money = (minor: unknown) => formatBDT(typeof minor === "number" ? minor : 0);

const count = (value: unknown) =>
  typeof value === "number" ? value.toLocaleString() : "0";

const Dashboard = ({
  dashboardData,
  userRole,
}: {
  dashboardData: any;
  userRole: string;
}) => {
  const data = dashboardData ?? {};
  const stats = buildStats(data, userRole);
  const recentAppointments = data.recentAppointments || [];
  const monthly = data.monthlyEarnings || [];
  const showMoneyPanel = userRole === "ADMIN" || userRole === "SALON_OWNER";

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
        <div className="flex flex-wrap gap-2">
          {userRole === "SALON_OWNER" && (
            <Link href="/dashboard/earnings">
              <Button variant="outline">
                <Banknote className="mr-2 h-4 w-4" />
                Earnings
              </Button>
            </Link>
          )}
          <Link href="/dashboard/wallet">
            <Button variant="outline">
              <Wallet className="mr-2 h-4 w-4" />
              Wallet
            </Button>
          </Link>
          <Link href="/dashboard/appointments">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </Link>
        </div>
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
            <Card className="h-full">
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
                        stat.trend === "down" ? "text-destructive" : "text-sage"
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
                  {stat.hint && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {stat.hint}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Money: the ledger view, for the two roles that have one */}
      {showMoneyPanel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Earnings over the last 6 months</CardTitle>
              {userRole === "SALON_OWNER" && (
                <Link href="/dashboard/earnings">
                  <Button variant="ghost" size="sm">
                    Details
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              <EarningsTrend months={monthly} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {userRole === "ADMIN" ? "Platform ledger" : "Money in motion"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {userRole === "ADMIN" ? (
                <>
                  <LedgerRow
                    label="Booked through the platform"
                    value={money(data.grossBookingsMinor)}
                  />
                  <LedgerRow
                    label="Commission earned"
                    value={money(data.totalRevenueMinor)}
                    accent="text-sage"
                  />
                  <LedgerRow
                    label="Earned by salons"
                    value={money(data.salonEarningsMinor)}
                  />
                  <LedgerRow
                    label="Owed to salons"
                    value={money(data.salonPayableMinor)}
                    accent="text-gold"
                  />
                  <LedgerRow
                    label="Paid out"
                    value={money(data.paidOutMinor)}
                  />
                  <LedgerRow
                    label="Customer wallet float"
                    value={money(data.walletFloatMinor)}
                  />
                  <LedgerRow
                    label="Deposits held"
                    value={money(data.depositsHeldMinor)}
                  />
                  <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                    <p>This month: {money(data.monthRevenueMinor)} commission</p>
                    <p>Today: {money(data.todayRevenueMinor)} commission</p>
                    <p>Average ticket: {money(data.averageTicketMinor)}</p>
                    <p>
                      {count(data.pendingPayoutCount)} payout(s) pending ·{" "}
                      {money(data.pendingPayoutMinor)}
                    </p>
                    <p>
                      Commission rate: {data.standardCommissionPercent ?? 10}%
                      on every booking
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <LedgerRow
                    label="Billed to customers"
                    value={money(data.grossBookingsMinor)}
                  />
                  <LedgerRow
                    label="Platform commission"
                    value={`-${money(data.commissionMinor)}`}
                    accent="text-destructive"
                  />
                  <LedgerRow
                    label="Net earnings"
                    value={money(data.netEarningsMinor)}
                    accent="text-sage"
                  />
                  <LedgerRow
                    label="Next payout"
                    value={money(data.payableMinor)}
                    accent="text-gold"
                  />
                  <LedgerRow
                    label="Paid out to date"
                    value={money(data.paidOutMinor)}
                  />
                  <LedgerRow
                    label="Wallet balance"
                    value={money(data.walletBalanceMinor)}
                  />
                  <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                    <p>This month: {money(data.monthNetMinor)} net</p>
                    <p>Today: {money(data.todayRevenueMinor)} billed</p>
                    <p>Average ticket: {money(data.averageTicketMinor)}</p>
                    <p>
                      Deposits held on upcoming bookings:{" "}
                      {money(data.depositsHeldMinor)}
                    </p>
                    <p>
                      Commission: {data.standardCommissionPercent ?? 10}% on every
                      completed booking
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

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
                        {typeof appointment.totalMinor === "number" &&
                          appointment.totalMinor > 0 && (
                            <span className="hidden text-sm font-medium sm:inline">
                              {money(appointment.totalMinor)}
                            </span>
                          )}
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

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {/* Appointment Status Breakdown */}
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
                {data.appointmentsByStatus?.length > 0 ? (
                  <>
                    {data.appointmentsByStatus.map(
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

                    {userRole === "CUSTOMER" && (
                      <div className="space-y-2 border-t pt-3 text-sm">
                        <LedgerRow
                          label="Total spent"
                          value={money(data.totalSpentMinor)}
                        />
                        <LedgerRow
                          label="Wallet balance"
                          value={money(data.walletBalanceMinor)}
                          accent="text-sage"
                        />
                        <LedgerRow
                          label="Deposits held"
                          value={money(data.depositsHeldMinor)}
                        />
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

          {/* Recent payouts, for whoever settles them */}
          {showMoneyPanel && data.recentPayouts?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Payouts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentPayouts.map((payout: any) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {money(payout.netMinor)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.salon?.name ? `${payout.salon.name} · ` : ""}
                        {payout.periodEnd
                          ? format(new Date(payout.periodEnd), "dd MMM yyyy")
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{payout.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const LedgerRow = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={accent ? `font-semibold ${accent}` : "font-medium"}>
      {value}
    </span>
  </div>
);

function buildStats(data: any, role: string) {
  if (role === "ADMIN") {
    return [
      {
        title: "Total Revenue (commission)",
        value: money(data.totalRevenueMinor),
        icon: Banknote,
        color: "bg-gradient-gold",
        hint: `${money(data.monthRevenueMinor)} this month`,
      },
      {
        title: "Booked through the platform",
        value: money(data.grossBookingsMinor),
        icon: Receipt,
        color: "bg-primary",
        hint: `${data.effectiveCommissionPercent ?? 0}% effective commission`,
      },
      {
        title: "Owed to salons",
        value: money(data.salonPayableMinor),
        icon: PiggyBank,
        color: "bg-sage",
        hint: `${count(data.pendingPayoutCount)} payout(s) pending`,
      },
      {
        title: "Total Users",
        value: count(data.totalUsers),
        icon: Users,
        color: "bg-gradient-rose",
        hint: `${count(data.totalSalons)} salons · ${count(
          data.activeSalons,
        )} active`,
      },
      {
        title: "Total Appointments",
        value: count(data.totalAppointments),
        icon: Calendar,
        color: "bg-primary",
        hint: `${count(data.todayAppointments)} today`,
      },
      {
        title: "Wallet float",
        value: money(data.walletFloatMinor),
        icon: Wallet,
        color: "bg-sage",
        hint: `${money(data.walletHeldMinor)} held against bookings`,
      },
      {
        title: "Paid out",
        value: money(data.paidOutMinor),
        icon: CheckCircle2,
        color: "bg-gradient-gold",
        hint:
          data.failedPayoutMinor > 0
            ? `${money(data.failedPayoutMinor)} failed`
            : "All transfers settled",
      },
      {
        title: "Commission rate",
        value: `${data.standardCommissionPercent ?? 10}%`,
        icon: Percent,
        color: "bg-gradient-rose",
        hint: "Flat rate on every completed booking",
      },
    ];
  }

  if (role === "SALON_OWNER") {
    return [
      {
        title: "Net Earnings",
        value: money(data.netEarningsMinor),
        icon: Banknote,
        color: "bg-gradient-gold",
        hint: `${money(data.monthNetMinor)} this month`,
      },
      {
        title: "Next Payout",
        value: money(data.payableMinor),
        icon: PiggyBank,
        color: "bg-sage",
        hint:
          data.processingPayoutMinor > 0
            ? `${money(data.processingPayoutMinor)} already batched`
            : "Awaiting the next batch",
      },
      {
        title: "Wallet Balance",
        value: money(data.walletBalanceMinor),
        icon: Wallet,
        color: "bg-primary",
        hint: `${money(data.walletAvailableMinor)} available`,
      },
      {
        title: "Platform Commission",
        value: money(data.commissionMinor),
        icon: Percent,
        color: "bg-gradient-rose",
        hint: `${data.standardCommissionPercent ?? 10}% on every booking`,
      },
      {
        title: "Today's Appointments",
        value: count(data.todayAppointments),
        icon: Calendar,
        color: "bg-gradient-rose",
        hint: `${money(data.todayRevenueMinor)} billed today`,
      },
      {
        title: "Total Appointments",
        value: count(data.totalAppointments),
        icon: Clock,
        color: "bg-primary",
        hint: `${count(data.completedAppointments)} completed`,
      },
      {
        title: "Pending",
        value: count(data.pendingAppointments),
        icon: Users,
        color: "bg-sage",
        change:
          data.pendingAppointments > 0
            ? `${data.pendingAppointments} awaiting`
            : undefined,
        trend: "up",
        hint: `${count(data.totalCustomers)} customers served`,
      },
      {
        title: "Services & Staff",
        value: `${count(data.totalServices)} / ${count(data.totalStaff)}`,
        icon: Package,
        color: "bg-gradient-gold",
        hint: `${count(data.totalSalons)} salon(s)`,
      },
    ];
  }

  if (role === "CUSTOMER") {
    return [
      {
        title: "Total Appointments",
        value: count(data.totalAppointments),
        icon: Calendar,
        color: "bg-gradient-rose",
        hint: `${count(data.todayAppointments)} today`,
      },
      {
        title: "Completed",
        value: count(data.completedAppointments),
        icon: CheckCircle2,
        color: "bg-sage",
        hint: `${count(data.cancelledAppointments)} cancelled`,
      },
      {
        title: "Upcoming",
        value: count(data.upcomingAppointments),
        icon: Clock,
        color: "bg-primary",
        hint: `${money(data.depositsHeldMinor)} held as deposits`,
      },
      {
        title: "Wallet Balance",
        value: money(data.walletBalanceMinor),
        icon: Wallet,
        color: "bg-gradient-gold",
        hint: `${money(data.totalSpentMinor)} spent all time`,
      },
    ];
  }

  // No role, or a role with no dashboard of its own.
  return [
    {
      title: "Appointments",
      value: count(data.totalAppointments),
      icon: Calendar,
      color: "bg-gradient-rose",
    },
    {
      title: "Salons",
      value: count(data.totalSalons),
      icon: Store,
      color: "bg-gradient-gold",
    },
  ];
}

export default Dashboard;
