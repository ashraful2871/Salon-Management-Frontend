"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { reviewsQuery, type ReviewFilters, type ReviewPage } from "./review-types";

/**
 * `GET /owner/reviews`: reviews of the branches in scope, newest first, with
 * the summary on the first page. A server action too, for "Load more".
 */
export const getOwnerReviews = async (
  filters: ReviewFilters,
  cursor?: string,
): Promise<ApiResponse<ReviewPage>> => {
  try {
    const query = reviewsQuery(filters, cursor);
    const response = await serverFetch.get(`/owner/reviews?limit=20&${query}`, {
      next: { revalidate: 60, tags: [TAGS.ownerReviews] },
    });
    return (await response.json()) as ApiResponse<ReviewPage>;
  } catch (error) {
    console.error("getOwnerReviews error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your reviews.",
    };
  }
};
