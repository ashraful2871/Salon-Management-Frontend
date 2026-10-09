"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

export type SalonListingInput = { name?: string; description?: string; phone?: string; reason?: string };

/** `PATCH /admin/salons/:id/listing`: name, description, phone. */
export const updateAdminSalonListing = async (
  id: string,
  input: SalonListingInput,
): Promise<ApiResponse<unknown>> => {
  const result = await adminSend<unknown>(
    "patch",
    `/admin/salons/${encodeURIComponent(id)}/listing`,
    input,
    "Couldn't save the listing. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminSalons);
    updateTag(TAGS.adminSalon(id));
    revalidateTag(TAGS.salons, "max");
    revalidateTag(TAGS.salon(id), "max");
    revalidateTag(TAGS.mySalons, "max");
  }
  return result;
};
