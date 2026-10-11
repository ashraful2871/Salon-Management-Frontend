"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/**
 * `POST /admin/bookings/:id/reverse-no-show`: the appeal-approve path, also
 * for a no-show nobody appealed. The forfeited deposit goes back.
 */
export const reverseNoShow = async (
  id: string,
  reason: string,
): Promise<ApiResponse<{ id: string; appealStatus: string | null }>> => {
  const result = await adminSend<{ id: string; appealStatus: string | null }>(
    "post",
    `/admin/bookings/${encodeURIComponent(id)}/reverse-no-show`,
    { reason },
    "Couldn't reverse this no-show. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminBooking(id));
    updateTag(TAGS.adminBookings);
    updateTag(TAGS.adminAppeals);
    updateTag(TAGS.adminInbox);
    revalidateTag(TAGS.appointments, "max");
    revalidateTag(TAGS.myAppointments, "max");
  }
  return result;
};
