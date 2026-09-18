"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { MyEarnings, PayoutStatus } from "@/services/settlement/settlement-types";
import EarningsTrend from "./EarningsTrend";

const payoutStyles: Record<PayoutStatus, string> = {
  PAID: "bg-sage/15 text-sage border-sage/30",
  PENDING: "bg-gold/15 text-gold border-gold/30",
  PROCESSING: "bg-primary/10 text-primary border-primary/30",
  FAILED: "bg-destructive/10 text-destructive border-destructive/30",
};

const csvEscape = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
        accent: "bg-gradient-gold",
      },
      {
        label: "Next payout",
        value: formatBDT(summary.payableMinor),
        hint:
          summary.processingPayoutMinor > 0
            ? `${formatBDT(summary.processingPayoutMinor)} already in a batch`
            : "Not yet rolled into a batch",
        icon: PiggyBank,
        accent: "bg-sage",
      },
      {
        label: "Paid out to date",
        value: formatBDT(summary.paidOutMinor),
        hint:
          summary.failedPayoutMinor > 0
            ? `${formatBDT(summary.failedPayoutMinor)} failed — contact support`
            : "Transferred to your account",
        icon: Banknote,
        accent: "bg-primary",
      },
      {
        label: "Platform commission",
        value: formatBDT(summary.commissionMinor),
        hint: `${summary.standardCommissionPercent}% on every booking · ${summary.effectiveCommissionPercent}% effective`,
        icon: Percent,
        accent: "bg-gradient-rose",
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
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Earnings unavailable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{error || "We could not load your earnings just now."}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl font-bold">
            <Banknote className="h-8 w-8 text-primary" /> Earnings &amp; Payouts
          </h1>
          <p className="mt-1 text-muted-foreground">
            Every figure below is read from the settlement ledger, so it always
            matches what you are actually paid.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/wallet">
              <Wallet className="mr-2 h-4 w-4" /> Wallet
            </Link>
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.accent}`}
                >
                  <card.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="mt-4 text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
            <div className="flex items-center justify-between border-t pt-3 font-semibold">
              <span>Net earnings</span>
              <span className="text-lg text-sage">
                {formatBDT(summary.netEarningsMinor)}
              </span>
            </div>
            <div className="space-y-1 pt-2 text-xs text-muted-foreground">
              <p>This month: {formatBDT(summary.monthNetMinor)} net</p>
              <p>Today: {formatBDT(summary.todayGrossMinor)} billed</p>
              <p>Average ticket: {formatBDT(summary.averageTicketMinor)}</p>
              <p>
                Deposits held on upcoming bookings:{" "}
                {formatBDT(summary.depositsHeldMinor)}
              </p>
            </div>
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
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <span className="font-medium">{salon.name}</span>
                <span className="font-semibold text-sage">
                  {formatBDT(salon.payableMinor)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="payouts">
        <TabsList>
          <TabsTrigger value="payouts">Payout history</TabsTrigger>
          <TabsTrigger value="bookings">Recent bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {payouts.length === 0 ? (
                <EmptyState
                  icon={PiggyBank}
                  title="No payouts raised yet"
                  body={
                    summary.payableMinor > 0
                      ? `${formatBDT(summary.payableMinor)} is waiting for the next payout batch.`
                      : "Completed bookings build up here, then go out in a batch."
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            <p className="font-medium">
                              {format(new Date(payout.periodStart), "dd MMM")} –{" "}
                              {format(new Date(payout.periodEnd), "dd MMM yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payout.salon?.name}
                              {payout.reference ? ` · ${payout.reference}` : ""}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatBDT(payout.grossMinor)}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            -{formatBDT(payout.commissionMinor)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sage">
                            {formatBDT(payout.netMinor)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={payoutStyles[payout.status]}
                            >
                              {payout.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {bookings.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No completed bookings yet"
                  body="Once a booking is marked complete it appears here with the commission it was charged."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead className="text-right">Billed</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">You earned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <p className="font-medium">
                              {booking.service?.name ?? "Service"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.customer?.name ?? "Customer"} ·{" "}
                              {format(
                                new Date(booking.appointmentDate),
                                "dd MMM yyyy",
                              )}
                              {booking.source === "SALON_DIRECT"
                                ? " · your own customer"
                                : ""}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatBDT(booking.totalMinor)}
                          </TableCell>
                          <TableCell className="text-right">
                            {booking.commissionMinor > 0 ? (
                              <span className="text-destructive">
                                -{formatBDT(booking.commissionMinor)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Free</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sage">
                            {formatBDT(booking.netMinor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
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
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={negative ? "text-destructive" : "font-medium"}>
      {negative ? `-${formatBDT(Math.abs(value))}` : formatBDT(value)}
    </span>
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof PiggyBank;
  title: string;
  body: string;
}) => (
  <div className="p-12 text-center text-muted-foreground">
    <Icon className="mx-auto mb-4 h-12 w-12 opacity-20" />
    <p className="font-medium text-foreground">{title}</p>
    <p className="mt-1 text-sm">{body}</p>
  </div>
);

export default EarningsView;
