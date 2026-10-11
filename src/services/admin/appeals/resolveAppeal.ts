"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/**
 * `PATCH /appointments/:id/appeal`: uphold (deposit back to the wallet) or
 * reject a pending no-show appeal. The customer is emailed either way.
 */
export const resolveAppeal = async (
  id: string,
  input: { approve: boolean; note?: string; reason?: string },
): Promise<ApiResponse<{ id: string; appealStatus: string | null }>> => {
  const result = await adminSend<{ id: string; appealStatus: string | null }>(
    "patch",
    `/appointments/${encodeURIComponent(id)}/appeal`,
    input,
    "Couldn't record the decision. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminAppeals);
    updateTag(TAGS.adminBooking(id));
    updateTag(TAGS.adminInbox);
    revalidateTag(TAGS.adminBookings, "max");
    revalidateTag(TAGS.appointments, "max");
    revalidateTag(TAGS.myAppointments, "max");
  }
  return result;
};
