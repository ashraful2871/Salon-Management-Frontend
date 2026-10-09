"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

type Moderated = {
  id: string;
  status: "PUBLISHED" | "HIDDEN";
  salon: { rating: number; totalReviews: number };
};

/**
 * `PATCH /admin/reviews/:id`: hide a review (with a reason, optionally
 * emailing the reviewer) or put it back / keep it. The salon's rating is
 * recomputed in the same transaction, so its public pages go stale too.
 */
export const moderateReview = async (
  id: string,
  salonId: string,
  input: { status: "HIDDEN" | "PUBLISHED"; reasonCode: string; note?: string; notify: boolean },
): Promise<ApiResponse<Moderated>> => {
  const result = await adminSend<Moderated>(
    "patch",
    `/admin/reviews/${encodeURIComponent(id)}`,
    { ...input, note: input.note?.trim() || undefined },
    "Couldn't update this review. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminReviews);
    updateTag(TAGS.adminInbox);
    revalidateTag(TAGS.salon(salonId), "max");
    revalidateTag(TAGS.salons, "max");
    revalidateTag(TAGS.reviews, "max");
  }
  return result;
};
