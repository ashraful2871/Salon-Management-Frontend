import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBDT } from "@/lib/money";
import type { OwnerHomeData } from "@/services/owner/home-types";

type Row = { key: string; count: number; label: string; href: string; value?: string };

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

/**
 * One row per thing waiting on the owner; rows at zero are left out. The
 * booking rows link to `/dashboard/appointments?attention=…`, which runs the
 * same filter the count did.
 */
export function NeedsAttention({
  attention: a,
  salonId,
}: {
  attention: OwnerHomeData["attention"];
  salonId: string | null;
}) {
  const pins = salonId ? `/dashboard/store/${salonId}?tab=location` : "/dashboard/store";
  const rows: Row[] = [
    {
      key: "pending",
      count: a.pendingConfirm,
      label: `${plural(a.pendingConfirm, "booking")} waiting for you to confirm`,
      href: "/dashboard/appointments?attention=pending",
    },
    {
      key: "stale",
      count: a.checkedInOver2h,
      label: `${plural(a.checkedInOver2h, "customer")} checked in over 2 hours ago`,
      href: "/dashboard/appointments?attention=stale",
    },
    {
      key: "unrecorded",
      count: a.unrecordedPayment,
      label: `${plural(a.unrecordedPayment, "completed booking")} with no payment recorded`,
      href: "/dashboard/appointments?attention=unrecorded",
    },
    {
      key: "appeal",
      count: a.appealsOpen,
      label: `${plural(a.appealsOpen, "no-show appeal")} open`,
      href: "/dashboard/appointments?attention=appeal",
    },
    {
      key: "reviews",
      count: a.unrepliedReviews,
      label: `${plural(a.unrepliedReviews, "review")} without a reply`,
      href: "/dashboard/reviews",
    },
    {
      key: "dues",
      count: a.duesMinor ?? 0,
      label: "You owe the platform",
      value: formatBDT(a.duesMinor ?? 0),
      href: "/dashboard/money",
    },
    {
      key: "payout",
      count: a.payoutFailed ?? 0,
      label: `${plural(a.payoutFailed ?? 0, "payout")} failed`,
      href: "/dashboard/money/payouts?status=FAILED",
    },
    {
      key: "account",
      count: a.accountUnverified ? 1 : 0,
      label: "No verified payout account yet",
      href: "/dashboard/money/payout-settings",
    },
    {
      key: "pins",
      count: a.approximatePins,
      label: `${plural(a.approximatePins, "branch", "branches")} with an approximate map pin`,
      href: pins,
    },
    {
      key: "slots",
      count: a.noSlotsNext7DaysCount,
      label: `${plural(a.noSlotsNext7DaysCount, "branch", "branches")} with no open slots in the next 7 days`,
      href: "/dashboard/slots",
    },
  ].filter((r) => r.count > 0);

  if (rows.length === 0) return null;

  return (
    <Card className="gap-2 border-warning/30">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className="size-4 text-warning" />
          Needs attention
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.key}>
              <Link
                href={r.href}
                className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-surface-subtle"
              >
                <span className="min-w-0 flex-1">{r.label}</span>
                {r.value && <span className="font-semibold tabular-nums">{r.value}</span>}
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
