"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { ProviderId } from "@/lib/payment-providers";
import { CHAT_RESUME_COOKIE } from "@/lib/assistant-request";
import {
  BOOKING_RESUME_COOKIE,
  BOOKING_RESUME_COOKIE_OPTIONS,
  bookingResumePath,
} from "@/lib/booking-resume";
import { deleteCookie, setCookie } from "@/services/auth/cookiesHandler";

type TopupResponse = {
  redirectUrl: string;
  transactionId: string;
};

/**
 * `returnTo` is the booking review page the top-up was opened from. It is
 * remembered (see `BOOKING_RESUME_COOKIE`) so the result page can lead back to
 * the booking; a top-up from anywhere else forgets any earlier one.
 */
export const initiateTopup = async (
  amountTaka: number,
  provider: ProviderId,
  returnTo?: string
): Promise<ApiResponse<TopupResponse>> => {
  try {
    const response = await serverFetch.post("/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountTaka, provider }),
    });

    const result = (await response.json()) as ApiResponse<TopupResponse>;

    if (result.success && result.data?.redirectUrl) {
      const bookingPath = bookingResumePath(returnTo);
      if (bookingPath) {
        await setCookie(BOOKING_RESUME_COOKIE, bookingPath, BOOKING_RESUME_COOKIE_OPTIONS);
        // This top-up, not an earlier chat one, decides where the result page leads.
        await deleteCookie(CHAT_RESUME_COOKIE);
      } else {
        await deleteCookie(BOOKING_RESUME_COOKIE);
      }
    }

    return result;
  } catch (error) {
    console.error("initiateTopup error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to initiate top-up.",
    };
  }
};
