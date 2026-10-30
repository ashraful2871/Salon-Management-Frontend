"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeEndResult } from "./types";

/** `POST /admin/home-service/bookings/:id/expert-no-show`: the expert never came; full refund plus the salon's credit. */
export const adminExpertNoShowHome = async (id: string, reason: string): Promise<ApiResponse<HomeEndResult>> => {
  const result = await adminHomeAction<HomeEndResult>(
    `/bookings/${enc(id)}/expert-no-show`,
    { reason },
    "Couldn't mark the visit. Please try again.",
  );
  if (result.success) {
    revalidateTag(TAGS.homeBooking(id), "max");
    revalidateTag(TAGS.myHomeBookings, "max");
    revalidateTag(TAGS.homeJobs, "max");
  }
  return result;
};
