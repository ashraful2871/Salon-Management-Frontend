"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerBookingAction } from "./owner-action";
import type { HomeEndResult } from "./types";

/** `POST /home-service/owner/bookings/:id/expert-no-show`: the expert never arrived (45 min after the start); full refund. */
export const markExpertNoShow = async (
  salonId: string,
  id: string,
  reason: string,
): Promise<ApiResponse<HomeEndResult>> =>
  ownerBookingAction<HomeEndResult>(salonId, id, "expert-no-show", { reason }, "Couldn't mark the visit. Please try again.");
