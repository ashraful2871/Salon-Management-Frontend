"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { homeSend } from "./request";
import type { HomeBooking, HomeCreateInput } from "./types";

/**
 * `POST /home-service/bookings`: holds the time as PENDING_PAYMENT until the
 * advance is paid. `idempotencyKey` is made by the component once per attempt
 * (`crypto.randomUUID()`) and reused on a retry, so a double tap or a retried
 * request returns the same booking instead of a second one.
 */
export const createHomeBooking = async (
  input: HomeCreateInput,
  idempotencyKey: string,
): Promise<ApiResponse<HomeBooking>> => {
  const result = await homeSend<HomeBooking>(
    "post",
    "/home-service/bookings",
    input,
    "Couldn't create the booking. Please try again.",
    { "Idempotency-Key": idempotencyKey, ...(await clientIpHeaders()) },
  );
  if (result.success && result.data) {
    updateTag(TAGS.myHomeBookings);
    revalidateTag(TAGS.homeAvailability(result.data.expert.id), "max");
  }
  return result;
};
