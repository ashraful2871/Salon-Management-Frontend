"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `DELETE /admin/salons/:id` (tier 3): soft delete; refused while upcoming bookings exist. */
export const deleteAdminSalon = async (
  id: string,
  reason: string,
  confirmName: string,
): Promise<ApiResponse<unknown>> => {
  const result = await adminSend<unknown>(
    "delete",
    `/admin/salons/${encodeURIComponent(id)}`,
    { reason, confirmName },
    "Couldn't delete this salon. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminSalons);
    revalidateTag(TAGS.adminSalon(id), "max");
    revalidateTag(TAGS.salons, "max");
    revalidateTag(TAGS.salon(id), "max");
    revalidateTag(TAGS.mySalons, "max");
  }
  return result;
};
