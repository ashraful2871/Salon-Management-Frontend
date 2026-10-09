"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/**
 * `POST /admin/salons/:id/cancel-upcoming` (tier 3): every upcoming booking is
 * cancelled as if the salon had - deposit back plus the goodwill credit.
 */
export const cancelSalonUpcoming = async (
  id: string,
  reason: string,
): Promise<ApiResponse<{ cancelled: number; failed: number }>> => {
  const result = await adminSend<{ cancelled: number; failed: number }>(
    "post",
    `/admin/salons/${encodeURIComponent(id)}/cancel-upcoming`,
    { reason },
    "Couldn't cancel the upcoming bookings. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminSalon(id));
    revalidateTag(TAGS.appointments, "max");
  }
  return result;
};
