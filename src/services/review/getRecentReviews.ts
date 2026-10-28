import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// `GET /reviews` names the reviewer `customer`; the `Review` type in
// api-types (with `user`) is a different endpoint's shape.
export type RecentReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customer?: { name?: string | null } | null;
  salon?: { id: string; name: string } | null;
};

/**
 * The newest reviews across all salons (the home page), or of one salon (the
 * ladies parlour page quotes its top-rated parlours).
 *
 * Bare `fetch`, no cookie: the answer is the same for every visitor, so they
 * all share one cached copy.
 */
export const getRecentReviews = async (
  limit = 12,
  salonId?: string,
): Promise<ApiResponse<RecentReview[]>> => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (salonId) params.set("salonId", salonId);
  try {
    const response = await fetch(`${BACKEND_API_URL}/reviews?${params}`, {
      next: { revalidate: 300, tags: [TAGS.reviews] },
    });
    return (await response.json()) as ApiResponse<RecentReview[]>;
  } catch (error) {
    console.error("getRecentReviews error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Something went wrong",
    };
  }
};
