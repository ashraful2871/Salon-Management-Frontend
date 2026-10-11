"use server";

import { serverFetch } from "@/lib/server-fetch";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import type { ApiResponse } from "@/lib/api-types";

export type ReviewReportReason = "ABUSIVE" | "PERSONAL_INFO" | "SPAM" | "FAKE" | "OTHER";

/**
 * `POST /reviews/:id/report`: a signed-in customer, or the salon's owner,
 * flags a review for the moderators. A second report of the same review
 * answers 409. Nothing on screen changes, so no cache tag is touched.
 */
export const reportReview = async (
  reviewId: string,
  input: { reason: ReviewReportReason; note?: string },
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.post(`/reviews/${encodeURIComponent(reviewId)}/report`, {
      body: JSON.stringify({ reason: input.reason, ...(input.note?.trim() ? { note: input.note.trim() } : {}) }),
      headers: { "Content-Type": "application/json", ...(await clientIpHeaders()) },
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<null>;
  } catch (error) {
    console.error("reportReview error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't send your report. Please try again.",
    };
  }
};
