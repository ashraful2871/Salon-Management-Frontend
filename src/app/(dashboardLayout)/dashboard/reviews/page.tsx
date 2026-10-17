import { PageHeader } from "@/components/Shared/PageHeader";
import { ErrorState } from "@/components/Shared/ErrorState";
import { ReviewsClient } from "@/components/Owner/reviews/ReviewsClient";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getOwnerReviews } from "@/services/owner/getOwnerReviews";
import { SHOW_OPTIONS, type ReviewFilters } from "@/services/owner/review-types";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, salonId, access] = await Promise.all([searchParams, getSelectedSalonId(), getMyAccess()]);

  const showParam = first(params.show);
  const show = SHOW_OPTIONS.some((o) => o.value === showParam) ? showParam! : "unreplied";
  const rating = Number(first(params.rating));

  const filters: ReviewFilters = {
    ...(salonId && { salonId }),
    ...(rating >= 1 && rating <= 5 && Number.isInteger(rating) && { rating }),
    ...(show === "unreplied" && { replied: "false" as const }),
    ...(show === "replied" && { replied: "true" as const }),
  };
  const result = await getOwnerReviews(filters);
  const multiBranch = !salonId && (access.data?.length ?? 0) > 1;

  return (
    <div>
      <PageHeader title="Reviews" description="What customers say, and your public replies." />
      {!result.success || !result.data ? (
        <ErrorState message={result.message} />
      ) : (
        <ReviewsClient
          key={JSON.stringify(filters)}
          initial={result.data.items}
          nextCursor={result.data.nextCursor}
          summary={result.data.summary}
          filters={filters}
          show={show}
          multiBranch={multiBranch}
        />
      )}
    </div>
  );
}
