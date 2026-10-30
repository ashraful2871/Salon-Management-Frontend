"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, homeSend } from "./request";
import type { HomeBooking } from "./types";

/** `POST /home-service/bookings/:id/appeal`: contest a kept fee; decided within 48 hours. */
export const appealHomeBooking = async (id: string, reason: string): Promise<ApiResponse<HomeBooking>> => {
  const result = await homeSend<HomeBooking>(
    "post",
    `/home-service/bookings/${enc(id)}/appeal`,
    { reason },
    "Couldn't send the appeal. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.homeBooking(id));
    updateTag(TAGS.myHomeBookings);
    revalidateTag(TAGS.adminAppeals, "max");
    revalidateTag(TAGS.adminHome, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
