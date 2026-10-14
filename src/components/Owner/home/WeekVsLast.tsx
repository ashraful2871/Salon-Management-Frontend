import { CalendarCheck, Percent, Star, UserPlus, Wallet } from "lucide-react";
import { StatCard } from "@/components/Shared/StatCard";
import { Sparkline } from "@/components/Admin/KpiTile";
import { formatBDT } from "@/lib/money";
import type { OwnerHomeData } from "@/services/owner/home-types";
import { cn } from "@/lib/utils";

/** "+12% vs previous 7 days"; `points` for rates and ratings. */
const Delta = ({
  now,
  before,
  lowerIsBetter = false,
  points = false,
}: {
  now: number;
  before: number;
  lowerIsBetter?: boolean;
  points?: boolean;
}) => {
  if (now === before) return <span className="block">Same as the previous 7 days</span>;
  const diff = points ? now - before : before === 0 ? 100 : ((now - before) / before) * 100;
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <span className={cn("block", good ? "text-success" : "text-danger")}>
      {diff > 0 ? "+" : ""}
      {Math.round(diff * 10) / 10}
      {points ? " pts" : "%"} vs previous 7 days
    </span>
  );
};

const Trend = ({ values, label }: { values: number[]; label: string }) => (
  <Sparkline values={values} label={label} className="mt-2 text-primary" />
);

/** The last 7 days against the 7 before, each with a daily sparkline. */
export function WeekVsLast({ week }: { week: OwnerHomeData["week"] }) {
  const { current: c, previous: p, series: s } = week;
  const ratingPoints = s.rating.filter((v): v is number => v !== null);

  return (
    <section aria-labelledby="week-heading" className="space-y-3">
      <h2 id="week-heading" className="text-base font-semibold">
        Last 7 days
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        <StatCard
          label="Revenue"
          value={formatBDT(c.revenueMinor)}
          icon={Wallet}
          tone="success"
          hint={
            <>
              <Delta now={c.revenueMinor} before={p.revenueMinor} />
              <Trend values={s.revenue} label="Daily revenue" />
            </>
          }
        />
        <StatCard
          label="Bookings"
          value={c.bookings.toLocaleString()}
          icon={CalendarCheck}
          tone="info"
          hint={
            <>
              <Delta now={c.bookings} before={p.bookings} />
              <Trend values={s.bookings} label="Daily bookings" />
            </>
          }
        />
        <StatCard
          label="New customers"
          value={c.newCustomers.toLocaleString()}
          icon={UserPlus}
          tone="primary"
          hint={
            <>
              <Delta now={c.newCustomers} before={p.newCustomers} />
              <Trend values={s.newCustomers} label="New customers per day" />
            </>
          }
        />
        <StatCard
          label="No-show rate"
          value={`${c.noShowRate}%`}
          icon={Percent}
          tone="warning"
          hint={
            <>
              <Delta now={c.noShowRate} before={p.noShowRate} lowerIsBetter points />
              <Trend values={s.noShowRate} label="Daily no-show rate" />
            </>
          }
        />
        <StatCard
          label="Rating"
          value={c.rating === null ? "—" : c.rating.toFixed(1)}
          icon={Star}
          tone="warning"
          hint={
            c.rating === null ? (
              "No new reviews"
            ) : (
              <>
                {p.rating !== null ? (
                  <Delta now={c.rating} before={p.rating} points />
                ) : (
                  <span className="block">From new reviews</span>
                )}
                <Trend values={ratingPoints} label="Daily average rating" />
              </>
            )
          }
        />
      </div>
    </section>
  );
}
