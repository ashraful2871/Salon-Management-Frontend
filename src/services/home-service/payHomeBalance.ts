"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, homeSend } from "./request";
import type { HomeBooking } from "./types";

/** `POST /home-service/bookings/:id/pay-balance`: holds the balance from the wallet, so the expert collects nothing. */
export const payHomeBalance = async (id: string): Promise<ApiResponse<HomeBooking>> => {
  const result = await homeSend<HomeBooking>(
    "post",
    `/home-service/bookings/${enc(id)}/pay-balance`,
    undefined,
    "Couldn't pay the balance. Please try again.",
  );
  if (result.success && result.data) {
    updateTag(TAGS.homeBooking(id));
    updateTag(TAGS.myHomeBookings);
    revalidateTag(TAGS.homeJobs, "max");
    revalidateTag(TAGS.ownerHomeServiceBookings(result.data.salon.id), "max");
  }
  return result;
};
