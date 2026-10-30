"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerBookingAction } from "./owner-action";
import type { OwnerHomeBooking } from "./types";

/** `POST /home-service/owner/bookings/:id/reassign`: a CONFIRMED visit to another free expert of the same side. */
export const reassignHome = async (
  salonId: string,
  id: string,
  expertId: string,
  reason: string,
): Promise<ApiResponse<OwnerHomeBooking>> =>
  ownerBookingAction<OwnerHomeBooking>(salonId, id, "reassign", { expertId, reason }, "Couldn't reassign the visit. Please try again.");
