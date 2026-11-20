import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import { percentLabel } from "@/lib/referral-terms";
import { bookHrefFor, fullDate, shortDate } from "@/lib/referral-view";
import type { RewardSummary } from "@/services/referral/types";

/**
 * The customer dashboard's referral line. A usable reward (and redemptions
 * on) → a slim success banner with "Book now"; otherwise, while the program
 * is on, a small invite card; otherwise nothing.
 */
export function DashboardReferral({
  summary,
  programOn,
  youPercent,
  friendPercent,
  now,
}: {
  summary: RewardSummary | null;
  programOn: boolean;
  youPercent: number;
  friendPercent: number;
  now: Date;
}) {
  const best = summary?.redemptionsOn && summary.available > 0 ? summary.best : null;

  if (best) {
    return (
      <section
        aria-label="Your reward"
        className="flex flex-col gap-3 rounded-2xl border border-success/30 bg-success-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-foreground">
          <span aria-hidden="true">🎁 </span>
          <span className="font-semibold">You have a {percentLabel(best.percent)} reward.</span> It&apos;s applied
          automatically at checkout ·{" "}
          <time dateTime={best.expiresAt} title={fullDate(best.expiresAt)}>
            expires {shortDate(best.expiresAt, now)}
          </time>
        </p>
        <Button asChild className="shrink-0 self-start sm:self-auto">
          <Link href={bookHrefFor(best.scope)}>Book now</Link>
        </Button>
      </section>
    );
  }

  if (!programOn) return null;

  return (
    <Link
      href="/dashboard/referrals"
      className="group flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Gift aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">Invite friends, get {percentLabel(youPercent)} off</span>
        <span className="block text-sm text-muted-foreground">
          They get {percentLabel(friendPercent)} off their first booking.
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
