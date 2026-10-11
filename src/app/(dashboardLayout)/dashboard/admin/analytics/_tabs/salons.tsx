import Link from "next/link";
import { ChartCard } from "@/components/Admin/analytics/ChartCard";
import { SalonLeaderboard } from "@/components/Admin/analytics/SalonLeaderboard";
import { csvHref, toApiQuery } from "@/components/Admin/analytics/filters";
import { getAnalyticsReport } from "@/services/admin/analytics/getAnalyticsReport";
import { KpiGrid, NotTracked, ReportError, SeriesCard, UpdatedNote, type TabProps } from "./shared";

export async function SalonsTab({ filters, defs, nowMs }: TabProps & { nowMs: number }) {
  const res = await getAnalyticsReport("salons", toApiQuery(filters));
  if (!res.success || !res.data) return <ReportError message={res.message} />;
  const r = res.data;

  return (
    <div className="space-y-4">
      <UpdatedNote at={r.fetchedAt} nowMs={nowMs} />
      <KpiGrid
        report={r}
        defs={defs}
        ids={[
          "salons.listed",
          "salons.active30d",
          "salons.timeToApproveHours",
          "slots.fillRate",
          "reviews.count",
          "reviews.avgRating",
          "reviews.hiddenShare",
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SeriesCard title="Salons listed" id="salons.listed" report={r} reportName="salons" filters={filters} defs={defs} />
        <SeriesCard title="Active salons (30 d)" id="salons.active30d" report={r} reportName="salons" filters={filters} defs={defs} />
      </div>

      <ChartCard
        title="Leaderboard"
        definition="Salons by completed booking value in the range. Sort by any column."
        csvHref={csvHref("salons", filters)}
        table={<SalonLeaderboard rows={r.tables.topSalons ?? []} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SeriesCard title="Reviews per day" id="reviews.count" kind="bars" report={r} reportName="salons" filters={filters} defs={defs} />
        <NotTracked
          title="Supply funnel"
          what="Applications → approved → listed → first booking → active isn't rolled up yet. Listed and active salons are in the tiles above."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NotTracked
          title="Location accuracy"
          what="The share of salons with an exact pin isn't rolled up yet."
        />
        <ChartCard
          title="Salons with no bookings in 30 days"
          table={
            <p className="py-4 text-sm text-muted-foreground">
              Not rolled up yet. Until it is, compare{" "}
              <span className="font-medium text-foreground">Salons listed</span> with{" "}
              <span className="font-medium text-foreground">Active salons (30 d)</span> above, and open a salon&apos;s 360 from the{" "}
              <Link href="/dashboard/admin/salons" className="font-medium text-foreground underline">
                Salons list
              </Link>
              .
            </p>
          }
        />
      </div>
    </div>
  );
}
