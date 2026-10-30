"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { enc, homeSend } from "./request";
import type { HomeBooking, HomeRescheduleInput } from "./types";

/**
 * `POST /home-service/bookings/:id/reschedule`: a CONFIRMED visit to another
 * time (same expert unless `expertId` says otherwise). The advance stays held.
 * `previousExpertId` lets the old expert's times be expired too.
 */
export const rescheduleHomeBooking = async (
  id: string,
  input: HomeRescheduleInput,
  previousExpertId?: string,
): Promise<ApiResponse<HomeBooking>> => {
  const result = await homeSend<HomeBooking>(
    "post",
    `/home-service/bookings/${enc(id)}/reschedule`,
    input,
    "Couldn't move the visit. Please try again.",
    await clientIpHeaders(),
  );
  if (result.success && result.data) {
    updateTag(TAGS.homeBooking(id));
    updateTag(TAGS.myHomeBookings);
    revalidateTag(TAGS.homeJobs, "max");
    revalidateTag(TAGS.homeAvailability(result.data.expert.id), "max");
    if (previousExpertId) revalidateTag(TAGS.homeAvailability(previousExpertId), "max");
    revalidateTag(TAGS.ownerHomeServiceBookings(result.data.salon.id), "max");
  }
  return result;
};
