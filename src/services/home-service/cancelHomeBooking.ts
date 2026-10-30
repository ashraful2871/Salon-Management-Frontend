"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, homeSend } from "./request";
import type { HomeBooking, HomeEndResult } from "./types";

/** `POST /home-service/bookings/:id/cancel`: the refund reaches the wallet in the same step. */
export const cancelHomeBooking = async (
  id: string,
  reason?: string,
): Promise<ApiResponse<HomeEndResult & { booking: HomeBooking }>> => {
  const result = await homeSend<HomeEndResult & { booking: HomeBooking }>(
    "post",
    `/home-service/bookings/${enc(id)}/cancel`,
    { reason },
    "Couldn't cancel the visit. Please try again.",
  );
  if (result.success && result.data) {
    updateTag(TAGS.homeBooking(id));
    updateTag(TAGS.myHomeBookings);
    revalidateTag(TAGS.homeJobs, "max");
    revalidateTag(TAGS.homeAvailability(result.data.booking.expert.id), "max");
    revalidateTag(TAGS.ownerHomeServiceBookings(result.data.booking.salon.id), "max");
    revalidateTag(TAGS.adminHome, "max");
  }
  return result;
};
