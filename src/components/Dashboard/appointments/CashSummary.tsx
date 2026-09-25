import { Card, CardContent } from "@/components/ui/card";
import { formatBDT } from "@/lib/money";
import type { CashSummary as CashSummaryData } from "@/lib/api-types";
import { dhakaToday, formatDay } from "./format";

const Tile = ({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "warn";
}) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-bold tabular-nums ${
          tone === "warn" ? "text-red-600 dark:text-red-400" : ""
        }`}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      )}
    </CardContent>
  </Card>
);

// The day's counter takings: what should come in, what has, and what is left.
export const CashSummary = ({
  summary,
  date,
}: {
  summary: CashSummaryData;
  date: string;
}) => {
  const byMethod = summary.collectedByMethod;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">
        Takings · {date === dhakaToday() ? "Today" : formatDay(date)}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          label="Expected"
          value={formatBDT(summary.expectedMinor ?? 0)}
          detail={`+ ${formatBDT(summary.depositsAppliedMinor ?? 0)} deposits applied`}
        />
        <Tile
          label="Collected"
          value={formatBDT(summary.collectedMinor ?? 0)}
          detail={`Cash ${formatBDT(byMethod?.CASH ?? 0)} · Card ${formatBDT(
            byMethod?.CARD ?? 0,
          )} · Mobile ${formatBDT(byMethod?.MOBILE_BANKING ?? 0)}`}
        />
        <Tile
          label="Outstanding"
          value={formatBDT(summary.outstandingMinor ?? 0)}
          detail="Still to take at the counter"
        />
        <Tile
          label="Not recorded"
          value={String(summary.unrecordedCount ?? 0)}
          detail="Completed with no payment written down"
          tone={summary.unrecordedCount > 0 ? "warn" : undefined}
        />
      </div>
    </section>
  );
};
