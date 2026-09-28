"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Package,
  Percent,
  PiggyBank,
  Receipt,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import type { Appointment, DashboardStats } from "@/lib/api-types";
import { TONE_CLASSES, toneOf, type Tone } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import EarningsTrend from "@/components/Earnings/EarningsTrend";
import CopyButton from "@/components/Wallet/CopyButton";
import { PageHeader } from "@/components/Shared/PageHeader";
import { StatCard } from "@/components/Shared/StatCard";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { EmptyState } from "@/components/Shared/EmptyState";
import { StatusBadge } from "@/components/Dashboard/appointments/StatusBadge";
import {
  formatDay,
  formatTime12,
} from "@/components/Dashboard/appointments/format";

/** Today in Dhaka, from the page, so server and browser agree. */
type Now = { ymd: string; hhmm: string };

type Stat = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: Tone;
};

/**
 * Money arrives as poisha under `<name>Minor`. `formatBDT` divides by 100
 * itself, so the taka twin `addTakaFields` adds alongside it must never be the
 * thing that reaches this component — that renders every amount 100x too small.
 */
const money = (minor: unknown) => formatBDT(typeof minor === "number" ? minor : 0);

const count = (value: unknown) =>
  typeof value === "number" ? value.toLocaleString() : "0";

const dayOf = (a: Appointment) => a.appointmentDate?.slice(0, 10) ?? "";
const startOf = (a: Appointment) => (a.startTime ?? "").padStart(5, "0");
const byStart = (a: Appointment, b: Appointment) =>
  `${dayOf(a)} ${startOf(a)}`.localeCompare(`${dayOf(b)} ${startOf(b)}`);

const dayLabel = (ymd: string, now: Now) =>
  !ymd ? "—" : ymd === now.ymd ? "Today" : formatDay(ymd);

// Payout periods are instants; show the Dhaka calendar day they fall on.
const dhakaYmd = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(
    new Date(iso),
  );

const OPEN_STATUSES = new Set(["PENDING", "CONFIRMED", "CHECKED_IN"]);
const CLOSED_STATUSES = new Set(["COMPLETED", "CANCELLED", "NO_SHOW"]);

/** The soonest booking still ahead of the customer, or null. */
const nextBooking = (list: Appointment[], now: Now) =>
  list
    .filter((a) => {
      if (!OPEN_STATUSES.has(a.status)) return false;
      const day = dayOf(a);
      if (day !== now.ymd) return day > now.ymd;
      // Checked in means they're in the queue, even if the slot time has passed.
      return a.status === "CHECKED_IN" || startOf(a) >= now.hhmm;
    })
    .sort(byStart)[0] ?? null;

/** Today's bookings that still need the desk, earliest first. */
const nextToday = (list: Appointment[], now: Now) =>
  list
    .filter((a) => dayOf(a) === now.ymd && !CLOSED_STATUSES.has(a.status))
    .sort(byStart)
    .slice(0, 3);

const APPOINTMENT_ROLES = new Set(["SALON_OWNER", "STAFF", "CUSTOMER"]);

const Dashboard = ({
  dashboardData,
  loadError,
  userRole,
  greeting,
  now,
}: {
  dashboardData: DashboardStats | null;
  loadError: string | null;
  userRole: string;
  greeting: string;
  now: Now;
}) => {
  const data: DashboardStats = dashboardData ?? {};
  const hasData = dashboardData !== null;
  const isOwner = userRole === "SALON_OWNER";
  const isCustomer = userRole === "CUSTOMER";
  const isAdmin = userRole === "ADMIN";
  const stats = hasData ? buildStats(data, userRole) : [];
  const recent = data.recentAppointments ?? [];
  const payouts = data.recentPayouts ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={greeting}
        actions={<HeaderActions role={userRole} />}
      />

      {loadError && (
        <p
          role="alert"
          className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          Your figures couldn&apos;t be loaded: {loadError}
        </p>
      )}

      {isCustomer && hasData && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <UpcomingBooking
            booking={nextBooking(recent, now)}
            now={now}
            className="lg:col-span-2"
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
            <StatCard
              label="Wallet balance"
              value={money(data.walletBalanceMinor)}
              hint={`${money(data.walletAvailableMinor)} available`}
              icon={Wallet}
              tone="success"
            />
            <StatCard
              label="Deposits held"
              value={money(data.depositsHeldMinor)}
              hint="On your upcoming bookings"
              icon={PiggyBank}
              tone="warning"
            />
          </div>
        </div>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              icon={stat.icon}
              tone={stat.tone}
            />
          ))}
        </div>
      )}

      {isOwner && hasData && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <TodayCard
            total={data.todayAppointments}
            next={nextToday(recent, now)}
          />
          <EarningsCard
            months={data.monthlyEarnings ?? []}
            detailsHref="/dashboard/earnings"
          />
        </div>
      )}

      {isAdmin && hasData && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <EarningsCard months={data.monthlyEarnings ?? []} />
          <PlatformLedger data={data} />
        </div>
      )}

      {hasData && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <RecentAppointments
            items={recent.slice(0, 5)}
            isCustomer={isCustomer}
            now={now}
            viewAllHref={
              APPOINTMENT_ROLES.has(userRole)
                ? "/dashboard/appointments"
                : undefined
            }
          />
          <div className="space-y-4 lg:space-y-6">
            {isAdmin && <ApprovalsCard pending={data.pendingSalons} />}
            {isOwner && <MoneyInMotion data={data} />}
            <StatusBreakdown
              title={isCustomer ? "Your bookings by status" : "Bookings by status"}
              rows={data.appointmentsByStatus ?? []}
            />
            {(isOwner || isAdmin) && payouts.length > 0 && (
              <RecentPayouts payouts={payouts} />
            )}
          </div>
        </div>
      )}

      {/* No stats endpoint for these roles: point them at their work instead. */}
      {!hasData && !loadError && userRole === "AGENT" && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <ApprovalsCard />
        </div>
      )}
      {!hasData && !loadError && userRole === "STAFF" && (
        <EmptyState
          icon={Calendar}
          title="Your day is in Appointments"
          description="Today's queue and your bookings live there."
          action={
            <Button asChild>
              <Link href="/dashboard/appointments">Open appointments</Link>
            </Button>
          }
        />
      )}
    </div>
  );
};

const HeaderActions = ({ role }: { role: string }) => {
  if (role === "SALON_OWNER") {
    return (
      <>
        <Button variant="outline" asChild>
          <Link href="/dashboard/earnings">
            <Banknote aria-hidden="true" />
            Earnings
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/appointments">
            <Calendar aria-hidden="true" />
            View schedule
          </Link>
        </Button>
      </>
    );
  }
  if (role === "CUSTOMER") {
    return (
      <>
        <Button variant="outline" asChild>
          <Link href="/dashboard/wallet">
            <Wallet aria-hidden="true" />
            Wallet
          </Link>
        </Button>
        <Button asChild>
          <Link href="/salons">
            <Search aria-hidden="true" />
            Book a salon
          </Link>
        </Button>
      </>
    );
  }
  return null;
};

const CardLink = ({ href, children }: { href: string; children: string }) => (
  <Button variant="ghost" size="sm" className="-my-1 shrink-0" asChild>
    <Link href={href}>
      {children}
      <ArrowUpRight aria-hidden="true" />
    </Link>
  </Button>
);

const TodayCard = ({ total, next }: { total?: number; next: Appointment[] }) => (
  <Card className="gap-4">
    <CardHeader className="px-4 sm:px-6">
      <CardTitle>Today</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-1 flex-col gap-4 px-4 sm:px-6">
      <p className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tabular-nums">
          {count(total)}
        </span>
        <span className="text-sm text-muted-foreground">
          booking{total === 1 ? "" : "s"} today
        </span>
      </p>

      {next.length === 0 ? (
        <p className="rounded-xl bg-surface-subtle px-3 py-4 text-center text-sm text-muted-foreground">
          Nothing waiting in the recent bookings.
        </p>
      ) : (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Next up</p>
          <ul className="divide-y divide-border">
            {next.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="w-[4.5rem] shrink-0 text-sm font-medium tabular-nums">
                  {formatTime12(a.startTime)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {a.customer?.name || "Customer"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.service?.name || "Service"}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button variant="outline" className="mt-auto w-full" asChild>
        <Link href="/dashboard/appointments">
          Open today&apos;s queue
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </CardContent>
  </Card>
);

const UpcomingBooking = ({
  booking,
  now,
  className,
}: {
  booking: Appointment | null;
  now: Now;
  className?: string;
}) => {
  if (!booking) {
    return (
      <Card className={cn("justify-center", className)}>
        <CardContent className="px-4 sm:px-6">
          <EmptyState
            icon={CalendarCheck}
            title="No upcoming bookings"
            description="Pick a salon and a time, and your booking will show up here."
            action={
              <Button asChild>
                <Link href="/salons">Find a salon</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-0 border-primary/30", className)}>
      <CardContent className="flex h-full flex-col gap-4 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary-hover">Your next booking</p>
            <h2 className="mt-1 truncate font-display text-xl font-semibold">
              {booking.salon?.name || "Salon"}
            </h2>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">When</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {dayLabel(dayOf(booking), now)} · {formatTime12(booking.startTime)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Service</dt>
            <dd className="mt-0.5 truncate font-medium">
              {booking.service?.name || "Service"}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          {booking.token ? (
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-border bg-surface-subtle py-0.5 pr-0.5 pl-3 font-mono text-sm">
              <span className="sr-only">Token </span>
              <span className="truncate">{booking.token}</span>
              <CopyButton value={booking.token} label="Token" className="rounded-full" />
            </span>
          ) : (
            <span />
          )}
          <Button asChild>
            <Link href="/dashboard/appointments">
              View booking
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const EarningsCard = ({
  months,
  detailsHref,
}: {
  months: NonNullable<DashboardStats["monthlyEarnings"]>;
  detailsHref?: string;
}) => (
  <Card className="min-w-0 gap-4 lg:col-span-2">
    <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6">
      <CardTitle>Earnings over the last 6 months</CardTitle>
      {detailsHref && <CardLink href={detailsHref}>Details</CardLink>}
    </CardHeader>
    <CardContent className="px-4 sm:px-6">
      <EarningsTrend months={months} />
    </CardContent>
  </Card>
);

const LedgerRow = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: Tone;
}) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <dt className="min-w-0 text-muted-foreground">{label}</dt>
    <dd
      className={cn(
        "shrink-0 tabular-nums",
        tone ? cn("font-semibold", TONE_CLASSES[tone].text) : "font-medium",
      )}
    >
      {value}
    </dd>
  </div>
);

const LedgerNotes = ({ children }: { children: ReactNode }) => (
  <div className="mt-2 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
    {children}
  </div>
);

const MoneyInMotion = ({ data }: { data: DashboardStats }) => (
  <Card className="gap-3">
    <CardHeader className="px-4 sm:px-6">
      <CardTitle>Money in motion</CardTitle>
    </CardHeader>
    <CardContent className="px-4 text-sm sm:px-6">
      <dl className="divide-y divide-border">
        <LedgerRow label="Billed to customers" value={money(data.grossBookingsMinor)} />
        <LedgerRow
          label="Platform commission"
          value={`-${money(data.commissionMinor)}`}
          tone="danger"
        />
        <LedgerRow label="Net earnings" value={money(data.netEarningsMinor)} tone="success" />
        <LedgerRow label="Next payout" value={money(data.payableMinor)} tone="warning" />
        <LedgerRow label="Paid out to date" value={money(data.paidOutMinor)} />
        <LedgerRow label="Wallet balance" value={money(data.walletBalanceMinor)} />
      </dl>
      <LedgerNotes>
        <p>This month: {money(data.monthNetMinor)} net</p>
        <p>Today: {money(data.todayRevenueMinor)} billed</p>
        <p>Average ticket: {money(data.averageTicketMinor)}</p>
        <p>Deposits held on upcoming bookings: {money(data.depositsHeldMinor)}</p>
        <p>
          Commission: {data.standardCommissionPercent ?? 10}% on every completed
          booking
        </p>
      </LedgerNotes>
    </CardContent>
  </Card>
);

const PlatformLedger = ({ data }: { data: DashboardStats }) => (
  <Card className="gap-3">
    <CardHeader className="px-4 sm:px-6">
      <CardTitle>Platform ledger</CardTitle>
    </CardHeader>
    <CardContent className="px-4 text-sm sm:px-6">
      <dl className="divide-y divide-border">
        <LedgerRow label="Booked through the platform" value={money(data.grossBookingsMinor)} />
        <LedgerRow label="Commission earned" value={money(data.totalRevenueMinor)} tone="success" />
        <LedgerRow label="Earned by salons" value={money(data.salonEarningsMinor)} />
        <LedgerRow label="Owed to salons" value={money(data.salonPayableMinor)} tone="warning" />
        <LedgerRow label="Paid out" value={money(data.paidOutMinor)} />
        <LedgerRow label="Customer wallet float" value={money(data.walletFloatMinor)} />
        <LedgerRow label="Deposits held" value={money(data.depositsHeldMinor)} />
      </dl>
      <LedgerNotes>
        <p>This month: {money(data.monthRevenueMinor)} commission</p>
        <p>Today: {money(data.todayRevenueMinor)} commission</p>
        <p>Average ticket: {money(data.averageTicketMinor)}</p>
        <p>
          {count(data.pendingPayoutCount)} payout(s) pending ·{" "}
          {money(data.pendingPayoutMinor)}
        </p>
        <p>
          Commission rate: {data.standardCommissionPercent ?? 10}% on every booking
        </p>
      </LedgerNotes>
    </CardContent>
  </Card>
);

const ApprovalsCard = ({ pending }: { pending?: number }) => (
  <Card className="py-4 sm:py-5">
    <CardContent className="flex items-center gap-4 px-4 sm:px-5">
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl",
          TONE_CLASSES.warning.soft,
          TONE_CLASSES.warning.text,
        )}
      >
        <ShieldCheck aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground">Pending approvals</p>
        {typeof pending === "number" ? (
          <p className="font-display text-2xl font-semibold tabular-nums">
            {count(pending)}
          </p>
        ) : (
          <p className="text-sm">Salons waiting for review</p>
        )}
      </div>
      <Button variant="outline" size="sm" className="shrink-0" asChild>
        <Link href="/dashboard/approval-salon">
          Review
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </Button>
    </CardContent>
  </Card>
);

const RecentAppointments = ({
  items,
  isCustomer,
  now,
  viewAllHref,
}: {
  items: Appointment[];
  isCustomer: boolean;
  now: Now;
  viewAllHref?: string;
}) => (
  <Card className="min-w-0 gap-3 lg:col-span-2">
    <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6">
      <CardTitle>Recent appointments</CardTitle>
      {viewAllHref && <CardLink href={viewAllHref}>View all</CardLink>}
    </CardHeader>
    <CardContent className="px-4 sm:px-6">
      {items.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No recent appointments"
          description="Bookings will show up here as they come in."
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <div className="w-[4.5rem] shrink-0 tabular-nums">
                <p className="text-sm font-medium">{formatTime12(a.startTime)}</p>
                <p className="text-xs text-muted-foreground">
                  {dayLabel(dayOf(a), now)}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {isCustomer
                    ? a.salon?.name || "Salon"
                    : a.customer?.name || "Customer"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[a.service?.name || "Service", !isCustomer && a.salon?.name]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {a.totalMinor > 0 && (
                <span className="hidden shrink-0 text-sm font-medium tabular-nums sm:inline">
                  {money(a.totalMinor)}
                </span>
              )}
              <StatusBadge status={a.status} className="shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

const StatusBreakdown = ({
  title,
  rows,
}: {
  title: string;
  rows: NonNullable<DashboardStats["appointmentsByStatus"]>;
}) => {
  const total = rows.reduce((sum, row) => sum + row._count, 0);
  const sorted = [...rows].sort((a, b) => b._count - a._count);

  return (
    <Card className="gap-4">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {sorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No bookings yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((row) => {
              const dot = TONE_CLASSES[toneOf(row.status)].dot;
              const share = total > 0 ? (row._count / total) * 100 : 0;
              return (
                <li key={row.status} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", dot)} />
                      <span className="truncate">{humanizeStatus(row.status)}</span>
                    </span>
                    <span className="font-semibold tabular-nums">{count(row._count)}</span>
                  </div>
                  <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", dot)} style={{ width: `${share}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const RecentPayouts = ({
  payouts,
}: {
  payouts: NonNullable<DashboardStats["recentPayouts"]>;
}) => (
  <Card className="gap-3">
    <CardHeader className="px-4 sm:px-6">
      <CardTitle>Recent payouts</CardTitle>
    </CardHeader>
    <CardContent className="px-4 sm:px-6">
      <ul className="divide-y divide-border">
        {payouts.map((payout) => (
          <li key={payout.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium tabular-nums">{money(payout.netMinor)}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[
                  payout.salon?.name,
                  payout.periodEnd && formatDay(dhakaYmd(payout.periodEnd), true),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <ToneBadge status={payout.status} className="shrink-0" />
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

// Tones: money coming in → success, owed or pending → warning, counts →
// neutral, platform-wide figures → primary.
function buildStats(data: DashboardStats, role: string): Stat[] {
  if (role === "ADMIN") {
    return [
      {
        label: "Commission revenue",
        value: money(data.totalRevenueMinor),
        icon: Banknote,
        tone: "success",
        hint: `${money(data.monthRevenueMinor)} this month`,
      },
      {
        label: "Booked through the platform",
        value: money(data.grossBookingsMinor),
        icon: Receipt,
        tone: "primary",
        hint: `${data.effectiveCommissionPercent ?? 0}% effective commission`,
      },
      {
        label: "Owed to salons",
        value: money(data.salonPayableMinor),
        icon: PiggyBank,
        tone: "warning",
        hint: `${count(data.pendingPayoutCount)} payout(s) pending`,
      },
      {
        label: "Total users",
        value: count(data.totalUsers),
        icon: Users,
        tone: "neutral",
        hint: `${count(data.totalSalons)} salons · ${count(data.activeSalons)} active`,
      },
      {
        label: "Total appointments",
        value: count(data.totalAppointments),
        icon: Calendar,
        tone: "neutral",
        hint: `${count(data.todayAppointments)} today`,
      },
      {
        label: "Wallet float",
        value: money(data.walletFloatMinor),
        icon: Wallet,
        tone: "primary",
        hint: `${money(data.walletHeldMinor)} held against bookings`,
      },
      {
        label: "Paid out",
        value: money(data.paidOutMinor),
        icon: CheckCircle2,
        tone: "primary",
        hint:
          (data.failedPayoutMinor ?? 0) > 0
            ? `${money(data.failedPayoutMinor)} failed`
            : "All transfers settled",
      },
      {
        label: "Commission rate",
        value: `${data.standardCommissionPercent ?? 10}%`,
        icon: Percent,
        tone: "primary",
        hint: "Flat rate on every completed booking",
      },
    ];
  }

  if (role === "SALON_OWNER") {
    return [
      {
        label: "Net earnings",
        value: money(data.netEarningsMinor),
        icon: Banknote,
        tone: "success",
        hint: `${money(data.monthNetMinor)} this month`,
      },
      {
        label: "Next payout",
        value: money(data.payableMinor),
        icon: PiggyBank,
        tone: "warning",
        hint:
          (data.processingPayoutMinor ?? 0) > 0
            ? `${money(data.processingPayoutMinor)} already batched`
            : "Awaiting the next batch",
      },
      {
        label: "Wallet balance",
        value: money(data.walletBalanceMinor),
        icon: Wallet,
        tone: "success",
        hint: `${money(data.walletAvailableMinor)} available`,
      },
      {
        label: "Platform commission",
        value: money(data.commissionMinor),
        icon: Percent,
        tone: "primary",
        hint: `${data.standardCommissionPercent ?? 10}% on every booking`,
      },
      {
        label: "Today's appointments",
        value: count(data.todayAppointments),
        icon: Calendar,
        tone: "neutral",
        hint: `${money(data.todayRevenueMinor)} billed today`,
      },
      {
        label: "Total appointments",
        value: count(data.totalAppointments),
        icon: Clock,
        tone: "neutral",
        hint: `${count(data.completedAppointments)} completed`,
      },
      {
        label: "Pending",
        value: count(data.pendingAppointments),
        icon: Users,
        tone: "warning",
        hint: `${count(data.totalCustomers)} customers served`,
      },
      {
        label: "Services & staff",
        value: `${count(data.totalServices)} / ${count(data.totalStaff)}`,
        icon: Package,
        tone: "neutral",
        hint: `${count(data.totalSalons)} salon(s)`,
      },
    ];
  }

  if (role === "CUSTOMER") {
    // Wallet balance and deposits sit beside the upcoming booking instead.
    return [
      {
        label: "Upcoming",
        value: count(data.upcomingAppointments),
        icon: Clock,
        tone: "neutral",
        hint: `${count(data.todayAppointments)} today`,
      },
      {
        label: "Completed",
        value: count(data.completedAppointments),
        icon: CheckCircle2,
        tone: "neutral",
        hint: `${count(data.cancelledAppointments)} cancelled`,
      },
      {
        label: "Total appointments",
        value: count(data.totalAppointments),
        icon: Calendar,
        tone: "neutral",
      },
      {
        label: "Total spent",
        value: money(data.totalSpentMinor),
        icon: Receipt,
        tone: "neutral",
        hint: "All time",
      },
    ];
  }

  return [];
}

export default Dashboard;
