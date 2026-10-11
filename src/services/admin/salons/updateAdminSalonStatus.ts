"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { SalonStatusInput, SalonStatusResult } from "./types";

/** `PATCH /admin/salons/:id/status`: approve, reject, suspend or reactivate, with a reason. */
export const updateAdminSalonStatus = async (
  id: string,
  input: SalonStatusInput,
): Promise<ApiResponse<SalonStatusResult>> => {
  const result = await adminSend<SalonStatusResult>(
    "patch",
    `/admin/salons/${encodeURIComponent(id)}/status`,
    input,
    "Couldn't change the salon's status. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminSalons);
    updateTag(TAGS.adminSalon(id));
    updateTag(TAGS.adminInbox);
    // Public lists, the detail page and the owner's dashboard follow.
    revalidateTag(TAGS.salons, "max");
    revalidateTag(TAGS.salon(id), "max");
    revalidateTag(TAGS.mySalons, "max");
  }
  return result;
};
