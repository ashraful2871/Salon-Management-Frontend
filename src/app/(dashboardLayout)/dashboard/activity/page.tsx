import { PageHeader } from "@/components/Shared/PageHeader";
import { ErrorState } from "@/components/Shared/ErrorState";
import { ActivityClient } from "@/components/Owner/activity/ActivityClient";
import { addDays, dhakaToday } from "@/components/Dashboard/appointments/format";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { getOwnerActivity } from "@/services/owner/getOwnerActivity";
import {
  ACTIVITY_GROUPS,
  ACTIVITY_RANGES,
  type ActivityFilters,
  type ActivityGroup,
  type ActivityRange,
} from "@/services/owner/activity-types";

export const metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const RANGE_DAYS: Record<ActivityRange, number> = { today: 0, "7d": 6, "30d": 29, "90d": 89 };

export default async function ActivityPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, salonId] = await Promise.all([searchParams, getSelectedSalonId()]);

  const actionParam = first(params.action);
  const action = ACTIVITY_GROUPS.some((g) => g.value === actionParam) ? (actionParam as ActivityGroup) : undefined;
  const rangeParam = first(params.range);
  const range: ActivityRange = ACTIVITY_RANGES.some((r) => r.value === rangeParam)
    ? (rangeParam as ActivityRange)
    : "30d";
  const actor = first(params.actor)?.slice(0, 64) || undefined;
  const today = dhakaToday();

  // The branch switcher decides the branch; "All branches" (owners) = every one.
  const filters: ActivityFilters = {
    ...(salonId && { salonId }),
    ...(action && { action }),
    ...(actor && { actor }),
    from: addDays(today, -RANGE_DAYS[range]),
    to: today,
  };
  const result = await getOwnerActivity(filters);

  return (
    <div>
      <PageHeader title="Activity" description="Who did what at your branches: check-ins, bookings, team and branch changes." />
      {!result.success || !result.data ? (
        <ErrorState message={result.message} />
      ) : (
        <ActivityClient
          key={JSON.stringify(filters)}
          initial={result.data.items}
          nextCursor={result.data.nextCursor}
          actors={result.data.actors}
          filters={filters}
          range={range}
          showBranch={!salonId}
        />
      )}
    </div>
  );
}
