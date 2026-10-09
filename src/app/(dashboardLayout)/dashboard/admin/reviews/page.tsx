import type { Metadata } from "next";
import { getAdminReviews } from "@/services/admin/reviews/getAdminReviews";
import type { AdminReviewFilters } from "@/services/admin/reviews/types";
import { ReviewsClient } from "./ReviewsClient";

export const metadata: Metadata = {
  title: "Reviews | Admin",
  description: "Moderate reported and low-rated reviews",
};

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** The URL is the state; the tab and every filter are search params. */
export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters: AdminReviewFilters = {
    tab: one(sp.tab) ?? "reported",
    salonId: one(sp.salonId),
    rating: one(sp.rating),
    includeTest: one(sp.includeTest),
    q: one(sp.q),
    sort: one(sp.sort),
    page: Math.max(1, Number(one(sp.page)) || 1),
  };

  const response = await getAdminReviews(filters);

  return <ReviewsClient response={response} filters={filters} />;
}
