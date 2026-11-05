"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerBookingAction } from "./owner-action";
import type { OwnerHomeBooking } from "./types";

/**
 * `POST /home-service/owner/bookings/:id/assign`: the branch picks who does an
 * "any available expert" visit. The customer is emailed the expert's name and
 * the visit appears in that expert's jobs.
 */
export const assignHomeExpert = async (
  salonId: string,
  id: string,
  expertId: string,
): Promise<ApiResponse<OwnerHomeBooking>> =>
  ownerBookingAction<OwnerHomeBooking>(salonId, id, "assign", { expertId }, "Couldn't assign the expert. Please try again.");
