import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import type { OwnerDues } from "@/services/owner/money-types";

const day = (iso: string) => format(new Date(iso), "EEE d MMM");

/**
 * Owner Home: the paused banner, and the "You owe ৳X" Needs-attention row.
 * Both link to Money, where the dues are paid.
 */
export function OwnerDuesAlerts({ dues }: { dues: OwnerDues }) {
  if (!dues.paused && dues.amountMinor <= 0) return null;

  return (
    <section aria-label="Needs attention" className="space-y-3">
      {dues.paused && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Online bookings are paused
              {dues.pausedAt ? ` since ${day(dues.pausedAt)}` : ""} because of unpaid dues. Walk-ins
              and existing bookings are not affected.
            </span>
          </p>
          <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
            <Link href="/dashboard/money">Pay to resume</Link>
          </Button>
        </div>
      )}
      {!dues.paused && dues.amountMinor > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              You owe <strong className="tabular-nums">{formatBDT(dues.amountMinor)}</strong>
              {dues.pauseAt ? ` - online bookings pause on ${day(dues.pauseAt)}` : ""}.
            </span>
          </p>
          <Button asChild size="sm" variant="outline" className="shrink-0 self-start sm:self-auto">
            <Link href="/dashboard/money">Pay now</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
