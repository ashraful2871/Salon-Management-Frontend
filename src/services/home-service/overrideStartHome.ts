"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerBookingAction } from "./owner-action";
import type { OwnerHomeBooking } from "./types";

/** `POST /home-service/owner/bookings/:id/override-start`: start without the customer's code (after a lockout). Audited. */
export const overrideStartHome = async (
  salonId: string,
  id: string,
  reason: string,
): Promise<ApiResponse<OwnerHomeBooking>> =>
  ownerBookingAction<OwnerHomeBooking>(salonId, id, "override-start", { reason }, "Couldn't start the visit. Please try again.");
