import { Banknote, CircleAlert, Clock, Receipt } from "lucide-react";
import { StatCard } from "@/components/Shared/StatCard";
import { formatBDT } from "@/lib/money";
import type { CashSummary as CashSummaryData } from "@/lib/api-types";
import { dhakaToday, formatDay } from "./format";

// The day's counter takings: what should come in, what has, and what is left.
export const CashSummary = ({
  summary,
  date,
}: {
  summary: CashSummaryData;
  date: string;
}) => {
  const byMethod = summary.collectedByMethod;
  const unrecorded = summary.unrecordedCount ?? 0;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Takings · {date === dhakaToday() ? "Today" : formatDay(date)}
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Expected"
          value={formatBDT(summary.expectedMinor ?? 0)}
          hint={`+ ${formatBDT(summary.depositsAppliedMinor ?? 0)} deposits applied`}
          icon={Receipt}
        />
        <StatCard
          label="Collected"
          value={formatBDT(summary.collectedMinor ?? 0)}
          hint={`Cash ${formatBDT(byMethod?.CASH ?? 0)} · Card ${formatBDT(
            byMethod?.CARD ?? 0,
          )} · Mobile ${formatBDT(byMethod?.MOBILE_BANKING ?? 0)}`}
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatBDT(summary.outstandingMinor ?? 0)}
          hint="Still to take at the counter"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Not recorded"
          value={String(unrecorded)}
          hint="Completed with no payment written down"
          icon={CircleAlert}
          tone={unrecorded > 0 ? "danger" : "neutral"}
        />
      </div>
    </section>
  );
};
