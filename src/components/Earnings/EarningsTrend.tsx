"use client";

import { useState } from "react";
import { formatBDT } from "@/lib/money";
import type { MonthlyEarnings } from "@/services/settlement/settlement-types";

/**
 * Net earnings per month, one bar each.
 *
 * Deliberately a single series. Gross and commission live on the same axis but
 * commission is a few percent of gross, so stacking them renders a sliver
 * nobody can read — the other two figures belong in the tooltip, where they can
 * be stated exactly instead of estimated off a bar.
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

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Net earnings after commission
      </p>

      <div className="flex h-52 items-end gap-2">
        {months.map((month) => {
          // A month with nothing in it still gets a hairline, so the axis reads
          // as "no earnings" rather than as a missing bar.
          const heightPct = hasAny
            ? Math.max((month.netMinor / peak) * 100, month.netMinor > 0 ? 4 : 1.5)
            : 1.5;
          const isActive = active === month.month;

          return (
            <div
              key={month.month}
              className="group relative flex h-full flex-1 flex-col justify-end"
              onMouseEnter={() => setActive(month.month)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(month.month)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              role="img"
              aria-label={`${month.label}: ${month.bookings} bookings, ${formatBDT(
                month.grossMinor,
              )} billed, ${formatBDT(month.commissionMinor)} commission, ${formatBDT(
                month.netMinor,
              )} net`}
            >
              {isActive && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-lg border bg-popover p-3 text-xs shadow-lg">
                  <p className="font-semibold text-foreground">{month.label}</p>
                  <dl className="mt-2 space-y-1">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Billed</dt>
                      <dd>{formatBDT(month.grossMinor)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Commission</dt>
                      <dd className="text-destructive">
                        -{formatBDT(month.commissionMinor)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t pt-1 font-semibold">
                      <dt>Net</dt>
                      <dd>{formatBDT(month.netMinor)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Bookings</dt>
                      <dd>{month.bookings}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div
                className="w-full rounded-t bg-gold transition-opacity"
                style={{
                  height: `${heightPct}%`,
                  opacity: active && !isActive ? 0.45 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2 border-t pt-2">
        {months.map((month) => (
          <span
            key={month.month}
            className="flex-1 text-center text-[11px] text-muted-foreground"
          >
            {month.label.split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
};

export default EarningsTrend;
