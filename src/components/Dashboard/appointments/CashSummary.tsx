import Link from "next/link";
import { Banknote, ChevronRight, CircleAlert, Clock, Receipt, type LucideIcon } from "lucide-react";
import { formatBDT } from "@/lib/money";
import type { CashSummary as CashSummaryData } from "@/lib/api-types";
import { TONE_CLASSES, type Tone } from "@/lib/status-tone";
import { cn } from "@/lib/utils";
import { dhakaToday, formatDay } from "./format";

/**
 * The day's counter takings in one card: what should come in, what has, and
 * what is left, with a bar for how much of the day's money is in.
 */
export const CashSummary = ({
  summary,
  date,
}: {
  summary: CashSummaryData;
  date: string;
}) => {
  const byMethod = summary.collectedByMethod;
  const unrecorded = summary.unrecordedCount ?? 0;
  const expected = summary.expectedMinor ?? 0;
  const collected = summary.collectedMinor ?? 0;
  const share = expected > 0 ? Math.min(Math.round((collected / expected) * 100), 100) : 0;
  const dayLabel = date === dhakaToday() ? "Today" : formatDay(date);

  return (
    <section aria-labelledby="takings-title" className="rounded-2xl border border-border bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3 sm:px-5">
        <h2 id="takings-title" className="text-sm font-semibold text-foreground">
          Takings <span className="font-normal text-muted-foreground">· {dayLabel}</span>
        </h2>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:max-w-sm">
          <div
            className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={share}
            aria-label="Share of expected takings collected"
          >
            <div className="h-full rounded-full bg-success" style={{ width: `${share}%` }} />
          </div>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{share}% collected</span>
          <Link
            href="/dashboard/close"
            className="hidden shrink-0 items-center gap-0.5 text-xs font-medium text-primary-hover hover:underline sm:inline-flex"
          >
            Daily close
            <ChevronRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </header>
      <dl className="grid grid-cols-2 lg:grid-cols-4">
        <Figure icon={Receipt} label="Expected" value={formatBDT(expected)}
          hint={`+ ${formatBDT(summary.depositsAppliedMinor ?? 0)} deposits applied`} />
        <Figure
          icon={Banknote}
          tone="success"
          label="Collected"
          value={formatBDT(collected)}
          hint={`Cash ${formatBDT(byMethod?.CASH ?? 0)} · Card ${formatBDT(byMethod?.CARD ?? 0)} · Mobile ${formatBDT(byMethod?.MOBILE_BANKING ?? 0)}`}
        />
        <Figure icon={Clock} tone="warning" label="Outstanding" value={formatBDT(summary.outstandingMinor ?? 0)}
          hint="Still to take at the counter" />
        <Figure
          icon={CircleAlert}
          tone={unrecorded > 0 ? "danger" : "neutral"}
          label="Not recorded"
          value={String(unrecorded)}
          hint="Completed with no payment written down"
        />
      </dl>
    </section>
  );
};

function Figure({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: Tone;
}) {
  return (
    <div className="min-w-0 border-border px-4 py-3.5 sm:px-5 [&:nth-child(odd)]:border-r lg:[&:not(:last-child)]:border-r [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className={cn("grid size-5 place-items-center rounded-md", TONE_CLASSES[tone].soft, TONE_CLASSES[tone].text)}>
          <Icon aria-hidden="true" className="size-3" />
        </span>
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight text-foreground tabular-nums sm:text-xl">{value}</dd>
      <dd className="mt-0.5 truncate text-[11px] text-muted-foreground" title={hint}>
        {hint}
      </dd>
    </div>
  );
}
