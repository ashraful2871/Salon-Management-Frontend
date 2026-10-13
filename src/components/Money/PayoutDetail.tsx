import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataList, type Column } from "@/components/Shared/DataList";
import { ToneBadge, humanizeStatus } from "@/components/Shared/ToneBadge";
import { formatBDT } from "@/lib/money";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import type { OwnerPayoutDetail, OwnerTransaction } from "@/services/owner/money-types";
import { TYPE_LABEL, bookingHref } from "./money-format";

const day = (iso: string) => format(new Date(iso), "d MMM yyyy");

const ENTRY_COLUMNS: Column<OwnerTransaction>[] = [
  {
    key: "date",
    header: "Date",
    cell: (t) => format(new Date(t.createdAt), "d MMM, h:mm a"),
    mobile: "eyebrow",
  },
  {
    key: "what",
    header: "What",
    cell: (t) => (
      <div className="min-w-0">
        <p className="font-medium">{TYPE_LABEL[t.type]}</p>
        <p className="text-xs text-muted-foreground">{t.description}</p>
      </div>
    ),
    mobileCell: (t) => `${TYPE_LABEL[t.type]} · ${t.description}`,
    mobile: "primary",
  },
  {
    key: "booking",
    header: "Booking",
    cell: (t) =>
      t.appointment?.token ? (
        <Link href={bookingHref(t.appointment.token)} className="font-medium text-primary underline-offset-4 hover:underline">
          {t.appointment.token}
        </Link>
      ) : (
        "—"
      ),
    mobileCell: (t) => t.appointment?.token ?? null,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (t) => (
      <span className={cn("font-semibold tabular-nums", TONE_CLASSES[t.amountMinor < 0 ? "danger" : "success"].text)}>
        {t.amountMinor > 0 ? "+" : ""}
        {formatBDT(t.amountMinor)}
      </span>
    ),
    mobile: "trailing",
  },
];

/** One payout: the figures, where it went, and every line it carried by branch. */
export function PayoutDetail({ payout: p }: { payout: OwnerPayoutDetail }) {
  const facts: [string, string][] = [
    ["Period", `${day(p.periodStart)} – ${day(p.periodEnd)}`],
    ["Gross", formatBDT(p.grossMinor)],
    ["Commission", formatBDT(p.commissionMinor)],
    ["Destination", p.destination ?? "—"],
    ["Reference", p.reference ?? "—"],
    ["Created", day(p.createdAt)],
    ["Paid on", p.paidAt ? day(p.paidAt) : "—"],
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/money/payouts">
          <ArrowLeft aria-hidden="true" /> All payouts
        </Link>
      </Button>

      {p.status === "FAILED" && (
        <div
          role="status"
          className={cn(
            "flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between",
            TONE_CLASSES.danger.soft,
          )}
        >
          <div className="flex min-w-0 gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm">
              This payout failed{p.failureReason ? `: ${p.failureReason}` : ""}. The money is back in
              your balance and goes out with the next payout.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
            <Link href="/dashboard/money/payout-settings">Fix payout account</Link>
          </Button>
        </div>
      )}

      <Card className="gap-3">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{p.salonName ?? "All branches"}</p>
            <CardTitle className="text-2xl tabular-nums">{formatBDT(p.netMinor)}</CardTitle>
          </div>
          <ToneBadge status={p.status}>{humanizeStatus(p.status)}</ToneBadge>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="truncate font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {p.cancelledReason && (
            <p className="mt-3 text-sm text-muted-foreground">Cancelled: {p.cancelledReason}</p>
          )}
        </CardContent>
      </Card>

      {p.branches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {p.status === "FAILED" || p.status === "CANCELLED"
            ? "Its lines went back to your balance."
            : "This payout has no lines."}
        </p>
      ) : (
        p.branches.map((b) => (
          <Card key={b.salonId ?? "none"} className="gap-3">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6">
              <CardTitle className="min-w-0 truncate">{b.salonName}</CardTitle>
              <span className="shrink-0 font-semibold tabular-nums">{formatBDT(b.totalMinor)}</span>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <DataList
                items={b.entries}
                rowKey={(t) => t.id}
                columns={ENTRY_COLUMNS}
                caption={`Lines for ${b.salonName}`}
                empty={null}
              />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
