"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, homeSend } from "./request";
import type { HomePayMethod, HomePayResult } from "./types";

/**
 * `POST /home-service/bookings/:id/pay`: a wallet that covers the advance
 * confirms at once (whatever `method` says); otherwise the shortfall goes to
 * bKash or the card gateway and `redirectUrl` is where to send the customer.
 * `idempotencyKey` is made per attempt by the component.
 */
export const payHomeBooking = async (
  id: string,
  method: HomePayMethod,
  idempotencyKey: string,
): Promise<ApiResponse<HomePayResult>> => {
  const result = await homeSend<HomePayResult>(
    "post",
    `/home-service/bookings/${enc(id)}/pay`,
    { method },
    "Couldn't start the payment. Please try again.",
    { "Idempotency-Key": idempotencyKey },
  );
  if (result.success && result.data && result.data.status !== "PENDING_PAYMENT") {
    updateTag(TAGS.homeBooking(id));
    updateTag(TAGS.myHomeBookings);
    revalidateTag(TAGS.homeJobs, "max");
    revalidateTag(TAGS.ownerHomeServiceBookings(result.data.booking.salon.id), "max");
  }
  return result;
};
