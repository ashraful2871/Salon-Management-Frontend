"use server";

import { revalidateTag, updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { ReviewReply } from "./review-types";

/**
 * `POST /reviews/:id/reply` (first reply) or `PATCH` (edit, within 24 h).
 * The reply is public, so the salon page and the public review lists are
 * refreshed in the background as well.
 */
export const replyToReview = async (
  reviewId: string,
  text: string,
  edit = false,
): Promise<ApiResponse<ReviewReply>> => {
  try {
    const path = `/reviews/${encodeURIComponent(reviewId)}/reply`;
    const init = {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      cache: "no-store" as const,
    };
    const response = edit ? await serverFetch.patch(path, init) : await serverFetch.post(path, init);
    const result = (await response.json()) as ApiResponse<ReviewReply>;
    if (result.success && result.data) {
      updateTag(TAGS.ownerReviews);
      updateTag(TAGS.ownerCustomers);
      if (!edit) updateTag(TAGS.ownerHomes);
      revalidateTag(TAGS.salon(result.data.salonId), "max");
      revalidateTag(TAGS.reviews, "max");
    }
    return result;
  } catch (error) {
    console.error("replyToReview error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't save your reply. Please try again.",
    };
  }
};
