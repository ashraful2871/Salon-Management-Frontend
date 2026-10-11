"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `PATCH /admin/salons/:id/location`: moves the pin and marks it exact. */
export const updateAdminSalonLocation = async (
  id: string,
  latitude: number,
  longitude: number,
): Promise<ApiResponse<unknown>> => {
  const result = await adminSend<unknown>(
    "patch",
    `/admin/salons/${encodeURIComponent(id)}/location`,
    { latitude, longitude },
    "Couldn't move the pin. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminSalons);
    updateTag(TAGS.adminSalon(id));
    revalidateTag(TAGS.salons, "max");
    revalidateTag(TAGS.salon(id), "max");
  }
  return result;
};
