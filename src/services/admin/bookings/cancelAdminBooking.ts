"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/**
 * `POST /admin/bookings/:id/cancel`: cancels a PENDING or CONFIRMED booking for
 * the customer. The whole deposit goes back, with no penalty.
 */
export const cancelAdminBooking = async (
  id: string,
  input: { reasonCode: string; note?: string; notify: boolean },
): Promise<ApiResponse<{ id: string; status: string }>> => {
  const result = await adminSend<{ id: string; status: string }>(
    "post",
    `/admin/bookings/${encodeURIComponent(id)}/cancel`,
    input,
    "Couldn't cancel this booking. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminBooking(id));
    updateTag(TAGS.adminBookings);
    revalidateTag(TAGS.appointments, "max");
    revalidateTag(TAGS.myAppointments, "max");
  }
  return result;
};
