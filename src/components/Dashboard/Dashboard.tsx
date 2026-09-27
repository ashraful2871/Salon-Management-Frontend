/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Percent,
  PiggyBank,
  Receipt,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatBDT } from "@/lib/money";
import EarningsTrend from "@/components/Earnings/EarningsTrend";
import { StatCard } from "@/components/Shared/StatCard";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { EmptyState } from "@/components/Shared/EmptyState";
import type { Tone } from "@/lib/status-tone";
import { PageHeader } from "@/components/Shared/PageHeader";

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
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here is what is happening today."
        actions={
          <>
            {userRole === "SALON_OWNER" && (
              <Button variant="outline" asChild>
                <Link href="/dashboard/earnings">
                  <Banknote className="mr-2 h-4 w-4" />
                  Earnings
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard/wallet">
                <Wallet className="mr-2 h-4 w-4" />
                Wallet
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/appointments">
                <Calendar className="mr-2 h-4 w-4" />
                View Schedule
              </Link>
            </Button>
          </>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((stat: any) => (
          <StatCard
            key={stat.title}
            label={stat.title}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      {/* Money: the ledger view, for the two roles that have one */}
      {showMoneyPanel && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Earnings over the last 6 months</CardTitle>
              {userRole === "SALON_OWNER" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/earnings">
                    Details
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
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
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Recent Appointments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Appointments</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/appointments">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentAppointments.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No recent appointments"
                    description="Bookings will show up here as they come in."
                  />
                ) : (
                  recentAppointments.slice(0, 5).map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 sm:p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-hover">
                          {(appointment.customer?.name || "U")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {appointment.customer?.name || "Customer"}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {appointment.service?.name || "Service"}
                            {appointment.salon?.name
                              ? ` • ${appointment.salon.name}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                        {typeof appointment.totalMinor === "number" &&
                          appointment.totalMinor > 0 && (
                            <span className="hidden text-sm font-medium sm:inline">
                              {money(appointment.totalMinor)}
                            </span>
                          )}
                        <span className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                          {appointment.startTime
                            ? formatTime12(appointment.startTime)
                            : "—"}
                        </span>
                        <ToneBadge status={appointment.status || "PENDING"} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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
              <div className="space-y-2">
                {data.appointmentsByStatus?.length > 0 ? (
                  <>
                    {data.appointmentsByStatus.map(
                      (item: any, index: number) => {
                        const statusLabel = (item.status || "")
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c: string) => c.toUpperCase());
                        return (
                          <div
                            key={item.status || index}
                            className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
                          >
                            <ToneBadge status={item.status || ""}>
                              {statusLabel}
                            </ToneBadge>
                            <span className="text-lg font-semibold tabular-nums">
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
                    className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"
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
                    <ToneBadge status={payout.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
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
        tone: "primary" as Tone,
        hint: `${money(data.monthRevenueMinor)} this month`,
      },
      {
        title: "Booked through the platform",
        value: money(data.grossBookingsMinor),
        icon: Receipt,
        tone: "info" as Tone,
        hint: `${data.effectiveCommissionPercent ?? 0}% effective commission`,
      },
      {
        title: "Owed to salons",
        value: money(data.salonPayableMinor),
        icon: PiggyBank,
        tone: "success" as Tone,
        hint: `${count(data.pendingPayoutCount)} payout(s) pending`,
      },
      {
        title: "Total Users",
        value: count(data.totalUsers),
        icon: Users,
        tone: "neutral" as Tone,
        hint: `${count(data.totalSalons)} salons · ${count(
          data.activeSalons,
        )} active`,
      },
      {
        title: "Total Appointments",
        value: count(data.totalAppointments),
        icon: Calendar,
        tone: "info" as Tone,
        hint: `${count(data.todayAppointments)} today`,
      },
      {
        title: "Wallet float",
        value: money(data.walletFloatMinor),
        icon: Wallet,
        tone: "success" as Tone,
        hint: `${money(data.walletHeldMinor)} held against bookings`,
      },
      {
        title: "Paid out",
        value: money(data.paidOutMinor),
        icon: CheckCircle2,
        tone: "primary" as Tone,
        hint:
          data.failedPayoutMinor > 0
            ? `${money(data.failedPayoutMinor)} failed`
            : "All transfers settled",
      },
      {
        title: "Commission rate",
        value: `${data.standardCommissionPercent ?? 10}%`,
        icon: Percent,
        tone: "neutral" as Tone,
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
        tone: "primary" as Tone,
        hint: `${money(data.monthNetMinor)} this month`,
      },
      {
        title: "Next Payout",
        value: money(data.payableMinor),
        icon: PiggyBank,
        tone: "success" as Tone,
        hint:
          data.processingPayoutMinor > 0
            ? `${money(data.processingPayoutMinor)} already batched`
            : "Awaiting the next batch",
      },
      {
        title: "Wallet Balance",
        value: money(data.walletBalanceMinor),
        icon: Wallet,
        tone: "info" as Tone,
        hint: `${money(data.walletAvailableMinor)} available`,
      },
      {
        title: "Platform Commission",
        value: money(data.commissionMinor),
        icon: Percent,
        tone: "neutral" as Tone,
        hint: `${data.standardCommissionPercent ?? 10}% on every booking`,
      },
      {
        title: "Today's Appointments",
        value: count(data.todayAppointments),
        icon: Calendar,
        tone: "neutral" as Tone,
        hint: `${money(data.todayRevenueMinor)} billed today`,
      },
      {
        title: "Total Appointments",
        value: count(data.totalAppointments),
        icon: Clock,
        tone: "info" as Tone,
        hint: `${count(data.completedAppointments)} completed`,
      },
      {
        title: "Pending",
        value: count(data.pendingAppointments),
        icon: Users,
        tone: "warning" as Tone,
        hint: `${count(data.totalCustomers)} customers served`,
      },
      {
        title: "Services & Staff",
        value: `${count(data.totalServices)} / ${count(data.totalStaff)}`,
        icon: Package,
        tone: "primary" as Tone,
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
        tone: "neutral" as Tone,
        hint: `${count(data.todayAppointments)} today`,
      },
      {
        title: "Completed",
        value: count(data.completedAppointments),
        icon: CheckCircle2,
        tone: "success" as Tone,
        hint: `${count(data.cancelledAppointments)} cancelled`,
      },
      {
        title: "Upcoming",
        value: count(data.upcomingAppointments),
        icon: Clock,
        tone: "info" as Tone,
        hint: `${money(data.depositsHeldMinor)} held as deposits`,
      },
      {
        title: "Wallet Balance",
        value: money(data.walletBalanceMinor),
        icon: Wallet,
        tone: "primary" as Tone,
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
      tone: "neutral" as Tone,
    },
    {
      title: "Salons",
      value: count(data.totalSalons),
      icon: Store,
      tone: "primary" as Tone,
    },
  ];
}

export default Dashboard;
