"use server";

import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { homeSend } from "./request";
import type { HomeQuote, HomeQuoteInput } from "./types";

/**
 * `POST /home-service/bookings/quote`: runs every booking check and prices the
 * visit, with the policy, the disclaimer and the `quoteHash` create needs.
 * Nothing is held.
 */
export const quoteHomeBooking = async (input: HomeQuoteInput): Promise<ApiResponse<HomeQuote>> =>
  homeSend<HomeQuote>(
    "post",
    "/home-service/bookings/quote",
    input,
    "Couldn't price this visit. Please try again.",
    await clientIpHeaders(),
  );
