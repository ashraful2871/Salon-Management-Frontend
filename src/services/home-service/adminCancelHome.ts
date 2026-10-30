"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeEndResult } from "./types";

/**
 * `POST /admin/home-service/bookings/:id/cancel`: always a full refund;
 * `salonAtFault` adds the salon's credit on top.
 */
export const adminCancelHome = async (
  id: string,
  reason: string,
  salonAtFault: boolean,
): Promise<ApiResponse<HomeEndResult>> => {
  const result = await adminHomeAction<HomeEndResult>(
    `/bookings/${enc(id)}/cancel`,
    { reason, salonAtFault },
    "Couldn't cancel the visit. Please try again.",
  );
  if (result.success) {
    revalidateTag(TAGS.homeBooking(id), "max");
    revalidateTag(TAGS.myHomeBookings, "max");
    revalidateTag(TAGS.homeJobs, "max");
  }
  return result;
};
