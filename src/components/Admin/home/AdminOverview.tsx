"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Percent,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardStats } from "@/lib/api-types";
import { TONE_CLASSES, type Tone } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/Shared/StatCard";
import {
  EarningsCard,
  LedgerNotes,
  LedgerRow,
  RecentAppointments,
  RecentPayouts,
  StatusBreakdown,
  count,
  money,
} from "@/components/Dashboard/Dashboard";

// The platform figures that used to be the ADMIN branch of the role
// dashboard (`components/Dashboard/Dashboard.tsx`), moved here unchanged for
// the admin Home. Phase 11 replaces them with KPI tiles.

type Stat = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone: Tone;
};

// Tones: money coming in → success, owed or pending → warning, counts →
// neutral, platform-wide figures → primary.
const adminStats = (data: DashboardStats): Stat[] => [
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
        <Link href="/dashboard/admin/salons?status=PENDING_APPROVAL">
          Review
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </Button>
    </CardContent>
  </Card>
);

/** Stat cards, earnings, ledger, recent bookings and payouts for an ADMIN. */
export function AdminOverview({
  data,
  now,
}: {
  data: DashboardStats;
  now: { ymd: string; hhmm: string };
}) {
  const stats = adminStats(data);
  const recent = data.recentAppointments ?? [];
  const payouts = data.recentPayouts ?? [];

  return (
    <>
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

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <EarningsCard months={data.monthlyEarnings ?? []} />
        <PlatformLedger data={data} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <RecentAppointments items={recent.slice(0, 5)} isCustomer={false} now={now} />
        <div className="space-y-4 lg:space-y-6">
          <ApprovalsCard pending={data.pendingSalons} />
          <StatusBreakdown title="Bookings by status" rows={data.appointmentsByStatus ?? []} />
          {payouts.length > 0 && <RecentPayouts payouts={payouts} />}
        </div>
      </div>
    </>
  );
}
