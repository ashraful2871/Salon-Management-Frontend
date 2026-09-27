"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Banknote,
  Download,
  Percent,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatBDT } from "@/lib/money";
import type {
  EarningsBooking,
  MyEarnings,
  Payout,
  PayoutStatus,
} from "@/services/settlement/settlement-types";
import type { Tone } from "@/lib/status-tone";
import EarningsTrend from "./EarningsTrend";
import { PageHeader } from "@/components/Shared/PageHeader";
import { StatCard } from "@/components/Shared/StatCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { DataList, type Column } from "@/components/Shared/DataList";

// PROCESSING isn't a status anywhere else, so it gets its tone here.
const payoutTone: Record<PayoutStatus, Tone> = {
  PAID: "success",
  PENDING: "warning",
  PROCESSING: "info",
  FAILED: "danger",
};

const csvEscape = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Dhaka dates, so the server render and the browser agree.
const DHAKA_MONTH_KEY = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  timeZone: "Asia/Dhaka",
});
const DHAKA_MONTH = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});
const DHAKA_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "Asia/Dhaka",
});
const monthKey = (iso: string) => DHAKA_MONTH_KEY.format(new Date(iso));
// "2026-09" -> "September 2026" (the 15th keeps it clear of any zone edge)
const monthLabel = (key: string) =>
  DHAKA_MONTH.format(new Date(`${key}-15T12:00:00Z`));
// en-GB prints "Sept"; the rest of the app writes "Sep".
const shortDate = (iso: string) =>
  DHAKA_DATE.format(new Date(iso)).replace("Sept", "Sep");

const payoutColumns: Column<Payout>[] = [
  {
    key: "period",
    header: "Period",
    mobile: "primary",
    cell: (p) => (
      <span className="font-medium whitespace-nowrap">
        {shortDate(p.periodStart)} – {shortDate(p.periodEnd)}
      </span>
    ),
  },
  {
    key: "salon",
    header: "Salon",
    mobile: "secondary",
    cell: (p) =>
      [p.salon?.name, p.reference].filter(Boolean).join(" · ") || null,
  },
  {
    key: "gross",
    header: "Gross",
    align: "right",
    cell: (p) => formatBDT(p.grossMinor),
    mobileCell: (p) => `Gross ${formatBDT(p.grossMinor)}`,
  },
  {
    key: "commission",
    header: "Commission",
    align: "right",
    cell: (p) => (
      <span className="text-muted-foreground">
        −{formatBDT(p.commissionMinor)}
      </span>
    ),
    mobileCell: (p) => `Commission −${formatBDT(p.commissionMinor)}`,
  },
  {
    key: "net",
    header: "Net",
    align: "right",
    mobile: "trailing",
    cell: (p) => (
      <span className="font-semibold tabular-nums text-foreground">
        {formatBDT(p.netMinor)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    mobile: "trailing",
    cell: (p) => <ToneBadge status={p.status} tone={payoutTone[p.status]} />,
  },
];

const bookingColumns: Column<EarningsBooking>[] = [
  {
    key: "booking",
    header: "Booking",
    mobile: "primary",
    cell: (b) => (
      <div className="min-w-0">
        <p className="font-medium">{b.service?.name ?? "Service"}</p>
        <p className="text-xs font-normal text-muted-foreground">
          {b.customer?.name ?? "Customer"} · {shortDate(b.appointmentDate)}
          {b.source === "SALON_DIRECT" ? " · your own customer" : ""}
        </p>
      </div>
    ),
    mobileCell: (b) => b.service?.name ?? "Service",
  },
  {
    key: "who",
    header: "Customer",
    mobile: "secondary",
    className: "hidden",
    cell: (b) =>
      [
        b.customer?.name ?? "Customer",
        shortDate(b.appointmentDate),
        b.source === "SALON_DIRECT" ? "your own customer" : null,
      ]
        .filter(Boolean)
        .join(" · "),
  },
  {
    key: "billed",
    header: "Billed",
    align: "right",
    cell: (b) => formatBDT(b.totalMinor),
    mobileCell: (b) => `Billed ${formatBDT(b.totalMinor)}`,
  },
  {
    key: "commission",
    header: "Commission",
    align: "right",
    cell: (b) =>
      b.commissionMinor > 0 ? (
        <span className="text-muted-foreground">−{formatBDT(b.commissionMinor)}</span>
      ) : (
        <span className="text-muted-foreground">Free</span>
      ),
    mobileCell: (b) =>
      b.commissionMinor > 0
        ? `Commission −${formatBDT(b.commissionMinor)}`
        : "No commission",
  },
  {
    key: "net",
    header: "You earned",
    align: "right",
    mobile: "trailing",
    cell: (b) => (
      <span className="font-semibold tabular-nums text-success">
        {formatBDT(b.netMinor)}
      </span>
    ),
  },
];

const MonthHeader = ({ month }: { month: string }) => (
  <span className="font-semibold text-foreground">{monthLabel(month)}</span>
);

const pillTabs = {
  list: "w-max rounded-full bg-muted p-1 group-data-[orientation=horizontal]/tabs:h-11",
  trigger: "h-9 flex-none rounded-full px-4 data-[state=active]:bg-surface",
};

const EarningsView = ({
  earnings,
  error,
}: {
  earnings: MyEarnings | null;
  error?: string;
}) => {
  const [downloading, setDownloading] = useState(false);

  const summary = earnings?.summary;
  const payouts = earnings?.payouts ?? [];
  const bookings = earnings?.recentBookings ?? [];
  const salons = earnings?.salons ?? [];

  const cards = useMemo(() => {
    if (!summary) return [];

    return [
      {
        label: "Net earnings",
        value: formatBDT(summary.netEarningsMinor),
        hint: `${summary.completedBookings.toLocaleString()} completed booking${
          summary.completedBookings === 1 ? "" : "s"
        }`,
        icon: TrendingUp,
        tone: "primary" as const,
      },
      {
        label: "Next payout",
        value: formatBDT(summary.payableMinor),
        hint:
          summary.processingPayoutMinor > 0
            ? `${formatBDT(summary.processingPayoutMinor)} already in a batch`
            : "Not yet rolled into a batch",
        icon: PiggyBank,
        tone: "success" as const,
      },
      {
        label: "Paid out to date",
        value: formatBDT(summary.paidOutMinor),
        hint:
          summary.failedPayoutMinor > 0
            ? `${formatBDT(summary.failedPayoutMinor)} failed — contact support`
            : "Transferred to your account",
        icon: Banknote,
        tone: "info" as const,
      },
      {
        label: "Platform commission",
        value: formatBDT(summary.commissionMinor),
        hint: `${summary.standardCommissionPercent}% on every booking · ${summary.effectiveCommissionPercent}% effective`,
        icon: Percent,
        tone: "neutral" as const,
      },
    ];
  }, [summary]);

  const exportCsv = () => {
    if (!earnings) return;
    setDownloading(true);

    try {
      const rows: Array<Array<string | number>> = [
        ["Section", "Label", "Gross (BDT)", "Commission (BDT)", "Net (BDT)", "Status"],
        ...earnings.summary.monthly.map((month) => [
          "Month",
          month.label,
          month.grossMinor / 100,
          month.commissionMinor / 100,
          month.netMinor / 100,
          `${month.bookings} bookings`,
        ]),
        ...payouts.map((payout) => [
          "Payout",
          `${format(new Date(payout.periodStart), "dd MMM yyyy")} - ${format(
            new Date(payout.periodEnd),
            "dd MMM yyyy",
          )}`,
          payout.grossMinor / 100,
          payout.commissionMinor / 100,
          payout.netMinor / 100,
          payout.status,
        ]),
        ...bookings.map((booking) => [
          "Booking",
          `${booking.service?.name ?? "Service"} — ${booking.customer?.name ?? "Customer"}`,
          booking.totalMinor / 100,
          booking.commissionMinor / 100,
          booking.netMinor / 100,
          format(new Date(booking.appointmentDate), "dd MMM yyyy"),
        ]),
      ];

      const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
      const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `earnings-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <PageHeader title="Earnings & payouts" />
        <div className="rounded-2xl border border-dashed border-border bg-surface">
          <EmptyState
            icon={TrendingUp}
            title="Earnings unavailable"
            description={error || "We could not load your earnings just now."}
            action={
              <Button asChild variant="outline">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings & payouts"
        description="Every figure below is read from the settlement ledger, so it always matches what you are actually paid."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/wallet">
                <Wallet /> Wallet
              </Link>
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={downloading}>
              <Download /> Export CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Last 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            <EarningsTrend months={summary.monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where the money came from</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Billed to customers" value={summary.grossBookingsMinor} />
            <Row
              label="Collected as deposits"
              value={summary.depositsCollectedMinor}
            />
            <Row
              label="Collected at the counter"
              value={summary.counterCollectedMinor}
            />
            <Row
              label="Platform commission"
              value={-summary.commissionMinor}
              negative
            />
            <div className="flex items-center justify-between border-t border-border pt-3 font-semibold">
              <span>Net earnings</span>
              <span className="text-lg tabular-nums text-success">
                {formatBDT(summary.netEarningsMinor)}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-surface-subtle p-3 text-xs">
              <MiniFigure label="This month (net)" value={summary.monthNetMinor} />
              <MiniFigure label="Billed today" value={summary.todayGrossMinor} />
              <MiniFigure label="Average ticket" value={summary.averageTicketMinor} />
              <MiniFigure
                label="Deposits held"
                value={summary.depositsHeldMinor}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {salons.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Owed per salon</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {salons.map((salon) => (
              <div
                key={salon.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <span className="min-w-0 truncate font-medium">{salon.name}</span>
                <span className="shrink-0 font-semibold tabular-nums text-success">
                  {formatBDT(salon.payableMinor)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="payouts">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          <TabsList className={pillTabs.list}>
            <TabsTrigger value="payouts" className={pillTabs.trigger}>
              Payouts
              <span className="tabular-nums text-muted-foreground">
                {payouts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className={pillTabs.trigger}>
              Recent bookings
              <span className="tabular-nums text-muted-foreground">
                {bookings.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="payouts" className="mt-4">
          <DataList
            items={payouts}
            rowKey={(p) => p.id}
            columns={payoutColumns}
            caption="Payouts"
            tableFrom="3xl"
            groupOf={(p) => monthKey(p.periodEnd)}
            groupHeader={(key) => <MonthHeader month={key} />}
            empty={
              <div className="rounded-2xl border border-dashed border-border bg-surface">
                <EmptyState
                  icon={PiggyBank}
                  title="No payouts raised yet"
                  description={
                    summary.payableMinor > 0
                      ? `${formatBDT(summary.payableMinor)} is waiting for the next payout batch.`
                      : "Completed bookings build up here, then go out in a batch."
                  }
                />
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <DataList
            items={bookings}
            rowKey={(b) => b.id}
            columns={bookingColumns}
            caption="Recent bookings"
            groupOf={(b) => monthKey(b.appointmentDate)}
            groupHeader={(key) => <MonthHeader month={key} />}
            empty={
              <div className="rounded-2xl border border-dashed border-border bg-surface">
                <EmptyState
                  icon={Receipt}
                  title="No completed bookings yet"
                  description="Once a booking is marked complete it appears here with the commission it was charged."
                />
              </div>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Row = ({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={
        negative ? "tabular-nums text-muted-foreground" : "font-medium tabular-nums"
      }
    >
      {negative ? `−${formatBDT(Math.abs(value))}` : formatBDT(value)}
    </span>
  </div>
);

const MiniFigure = ({ label, value }: { label: string; value: number }) => (
  <div className="min-w-0">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-semibold tabular-nums text-foreground">
      {formatBDT(value)}
    </dd>
  </div>
);

export default EarningsView;
