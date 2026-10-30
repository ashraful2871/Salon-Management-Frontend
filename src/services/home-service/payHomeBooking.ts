"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { CHAT_RESUME_COOKIE } from "@/lib/assistant-request";
import { BOOKING_RESUME_COOKIE, BOOKING_RESUME_COOKIE_OPTIONS, homeBookingPath } from "@/lib/booking-resume";
import { TAGS } from "@/lib/cache-tags";
import { deleteCookie, setCookie } from "@/services/auth/cookiesHandler";
import { enc, homeSend } from "./request";
import type { HomePayMethod, HomePayResult } from "./types";

/**
 * `POST /home-service/bookings/:id/pay`: a wallet that covers the advance
 * confirms at once (whatever `method` says); otherwise the shortfall goes to
 * bKash or the card gateway and `redirectUrl` is where to send the customer.
 * `idempotencyKey` is made per attempt by the component. The gateway always
 * returns to the wallet result pages, so the visit's page (with `via`, which
 * the page tracks the payment by) rides in the booking-resume cookie.
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
  if (result.success && result.data?.status === "PENDING_PAYMENT") {
    await setCookie(
      BOOKING_RESUME_COOKIE,
      `${homeBookingPath(id)}?via=${result.data.paidFrom.toLowerCase()}`,
      BOOKING_RESUME_COOKIE_OPTIONS,
    );
    await deleteCookie(CHAT_RESUME_COOKIE);
  } else if (result.success && result.data && result.data.status !== "PENDING_PAYMENT") {
    updateTag(TAGS.homeBooking(id));
    updateTag(TAGS.myHomeBookings);
    revalidateTag(TAGS.homeJobs, "max");
    revalidateTag(TAGS.ownerHomeServiceBookings(result.data.booking.salon.id), "max");
  }
  return result;
};
