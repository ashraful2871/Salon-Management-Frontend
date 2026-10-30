"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerBookingAction } from "./owner-action";
import type { HomeEndResult } from "./types";

/** `POST /home-service/owner/bookings/:id/cancel`: the salon cancels; the customer gets everything back plus any salon credit. */
export const ownerCancelHome = async (
  salonId: string,
  id: string,
  reason: string,
): Promise<ApiResponse<HomeEndResult>> =>
  ownerBookingAction<HomeEndResult>(salonId, id, "cancel", { reason }, "Couldn't cancel the visit. Please try again.");
