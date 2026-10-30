"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc, homeGet } from "./request";
import type { HomeCancelQuote } from "./types";

/** `GET /home-service/bookings/:id/cancel-quote`: what cancelling now returns, from the booking's own policy. */
export const getHomeCancelQuote = async (id: string): Promise<ApiResponse<HomeCancelQuote>> =>
  homeGet<HomeCancelQuote>(
    `/home-service/bookings/${enc(id)}/cancel-quote`,
    { cache: "no-store" },
    "Couldn't work out the refund. Please try again.",
  );
