import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Hourglass,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/Shared/StatCard";
import { DataList, type Column } from "@/components/Shared/DataList";
import EarningsTrend from "@/components/Earnings/EarningsTrend";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { TONE_CLASSES } from "@/lib/status-tone";
import type { BranchBuckets, OwnerMoneySummary } from "@/services/owner/money-types";
import { DuesCard } from "./DuesCard";

const day = (iso: string) => format(new Date(iso), "EEE d MMM");

const BRANCH_COLUMNS: Column<BranchBuckets>[] = [
  { key: "branch", header: "Branch", cell: (b) => b.salonName, mobile: "primary" },
  {
    key: "pending",
    header: "Clearing",
    align: "right",
    cell: (b) => <span className="tabular-nums">{formatBDT(b.pendingMinor)}</span>,
    mobileCell: (b) => `Clearing ${formatBDT(b.pendingMinor)}`,
  },
  {
    key: "available",
    header: "Next payout",
    align: "right",
    cell: (b) => <span className="tabular-nums">{formatBDT(b.availableMinor)}</span>,
    mobileCell: (b) => `Next ${formatBDT(b.availableMinor)}`,
  },
  {
    key: "inPayout",
    header: "On its way",
    align: "right",
    cell: (b) => <span className="tabular-nums">{formatBDT(b.inPayoutMinor)}</span>,
    mobileCell: (b) => `On its way ${formatBDT(b.inPayoutMinor)}`,
  },
  {
    key: "paid",
    header: "Paid to date",
    align: "right",
    cell: (b) => <span className="tabular-nums">{formatBDT(b.paidMinor)}</span>,
    mobile: "trailing",
  },
];

/** The Money hub's first tab: where every taka is right now, and how it moves. */
export function MoneyOverview({ summary: s }: { summary: OwnerMoneySummary }) {
  const verified = s.account?.status === "VERIFIED";
  const lastFailed = s.lastPayout?.status === "FAILED";

  return (
    <div className="space-y-6">
      {(lastFailed || !verified || s.payoutsFrozen) && (
        <div
          role="status"
          className={cn(
            "flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between",
            TONE_CLASSES[lastFailed ? "danger" : "warning"].soft,
          )}
        >
          <div className="flex min-w-0 gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm">
              {lastFailed
                ? `Your last payout of ${formatBDT(s.lastPayout!.netMinor)} failed${s.lastPayout!.failureReason ? `: ${s.lastPayout!.failureReason}` : ""}. The money is back in your balance.`
                : s.payoutsFrozen
                  ? "Payouts to your business are on hold. Our finance team will contact you."
                  : s.account
                    ? "Your payout account is not verified yet, so payouts wait until it is."
                    : "Add a payout account so we can send you your earnings."}
            </p>
          </div>
          {!s.payoutsFrozen && (
            <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
              <Link href="/dashboard/money/payout-settings">
                {lastFailed ? "Fix payout account" : "Payout settings"}
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Clearing"
          value={formatBDT(s.pendingMinor)}
          hint={`Clears ${s.holdDays} days after the booking`}
          icon={Hourglass}
          tone="warning"
        />
        <StatCard
          label={`Next payout · ${day(s.nextPayoutDate)}`}
          value={formatBDT(s.availableMinor)}
          hint={
            s.availableMinor < s.minMinor
              ? `Sent once it reaches ${formatBDT(s.minMinor)}`
              : s.account
                ? `To ${s.account.label}`
                : "Add a payout account"
          }
          icon={CalendarClock}
          tone="info"
        />
        <StatCard
          label="On its way"
          value={formatBDT(s.inPayoutMinor)}
          hint="In a payout being sent"
          icon={Send}
          tone="primary"
        />
        <StatCard
          label="Paid this month"
          value={formatBDT(s.paidThisMonthMinor)}
          hint={
            s.lastPayout?.paidAt
              ? `Last: ${formatBDT(s.lastPayout.netMinor)} on ${day(s.lastPayout.paidAt)}`
              : "No payouts yet"
          }
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {(s.dues.amountMinor > 0 || s.dues.paused) && <DuesCard dues={s.dues} />}

      {s.perSalon.length > 1 && (
        <Card className="gap-3">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>By branch</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <DataList
              items={s.perSalon}
              rowKey={(b) => b.salonId ?? "none"}
              columns={BRANCH_COLUMNS}
              caption="Money by branch"
              empty={null}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="gap-3 lg:col-span-2">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Last 6 months</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto px-4 sm:px-6">
            <EarningsTrend months={s.monthly} />
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>How you get paid</CardTitle>
          </CardHeader>
          <CardContent className="px-4 text-sm sm:px-6">
            <ol className="space-y-3">
              {[
                "Money paid at your counter is yours at once.",
                `What customers pay through us clears ${s.holdDays} days after the booking.`,
                "Every Monday we send what has cleared to your payout account — or, if you owe us, you pay it by bKash.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              {s.commissionPercent}% on bookings we bring you;{" "}
              {s.commissionOnDirect
                ? `your walk-ins pay ${s.commissionPercent}% too.`
                : "your walk-ins are free."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
