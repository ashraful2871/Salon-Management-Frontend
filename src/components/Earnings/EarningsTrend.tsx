"use client";

import { useState } from "react";
import { formatBDT } from "@/lib/money";
import type { MonthlyEarnings } from "@/services/settlement/settlement-types";
import { cn } from "@/lib/utils";

/**
 * Net earnings per month, one bar each.
 *
 * Deliberately a single series. Gross and commission live on the same axis but
 * commission is a few percent of gross, so stacking them renders a sliver
 * nobody can read — the other two figures belong in the detail line, where
 * they can be stated exactly instead of estimated off a bar.
 *
 * The detail line sits under the chart rather than floating over it: the chart
 * scrolls sideways on a phone, and a scroll box would clip a tooltip. It shows
 * the latest month until a bar is hovered, focused or tapped.
 */
const EarningsTrend = ({ months }: { months: MonthlyEarnings[] }) => {
  const [active, setActive] = useState<string | null>(null);

  if (months.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No earnings history yet.
      </p>
    );
  }

  const peak = Math.max(...months.map((month) => month.netMinor), 1);
  const hasAny = months.some((month) => month.netMinor > 0);
  const shown =
    months.find((month) => month.month === active) ?? months[months.length - 1];

  return (
    <div className="min-w-0">
      <p className="mb-4 text-sm text-muted-foreground">
        Net earnings after commission
      </p>

      <div className="overflow-x-auto overscroll-x-contain">
        <div className="min-w-[480px]">
          <div className="relative h-52">
            {/* Grid lines at 0, 25, 50, 75 and 100% of the tallest month. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex flex-col justify-between"
            >
              {[0, 1, 2, 3, 4].map((line) => (
                <div key={line} className="border-t border-border" />
              ))}
            </div>

            <div className="relative flex h-full items-end gap-2">
              {months.map((month) => {
                // A month with nothing in it still gets a hairline, so the axis
                // reads as "no earnings" rather than as a missing bar.
                const heightPct = hasAny
                  ? Math.max((month.netMinor / peak) * 100, month.netMinor > 0 ? 4 : 1.5)
                  : 1.5;
                const isShown = shown.month === month.month;

                return (
                  <div
                    key={month.month}
                    className="flex h-full flex-1 cursor-pointer flex-col justify-end rounded-t outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onMouseEnter={() => setActive(month.month)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(month.month)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(month.month)}
                    tabIndex={0}
                    role="img"
                    aria-label={`${month.label}: ${month.bookings} bookings, ${formatBDT(
                      month.grossMinor,
                    )} billed, ${formatBDT(month.commissionMinor)} commission, ${formatBDT(
                      month.netMinor,
                    )} net`}
                  >
                    <div
                      className={cn(
                        "mx-auto w-full max-w-14 rounded-t bg-primary transition-opacity",
                        active && !isShown && "opacity-45",
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            {months.map((month) => (
              <span
                key={month.month}
                className={cn(
                  "flex-1 text-center text-xs text-muted-foreground",
                  shown.month === month.month && "font-medium text-foreground",
                )}
              >
                {month.label.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <dl
        aria-live="polite"
        className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-surface-subtle p-3 text-sm sm:grid-cols-4"
      >
        <div className="col-span-2 sm:col-span-4">
          <dt className="sr-only">Month</dt>
          <dd className="font-medium">{shown.label}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Billed</dt>
          <dd className="tabular-nums">{formatBDT(shown.grossMinor)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Commission</dt>
          <dd className="text-danger tabular-nums">-{formatBDT(shown.commissionMinor)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Net</dt>
          <dd className="font-semibold tabular-nums">{formatBDT(shown.netMinor)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Bookings</dt>
          <dd className="tabular-nums">{shown.bookings.toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
};

export default EarningsTrend;
