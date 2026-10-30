"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { ownerAction } from "./owner-action";
import type { HomeExpertRemoveResult } from "./types";

/**
 * `DELETE /home-service/owner/experts/:id`: upcoming visits move to another
 * expert of the branch, else are cancelled with a full refund. 409 while a
 * visit is under way.
 */
export const removeHomeExpert = async (
  salonId: string,
  id: string,
  reason?: string,
): Promise<ApiResponse<HomeExpertRemoveResult>> => {
  const result = await ownerAction<HomeExpertRemoveResult>(
    salonId,
    "delete",
    `/experts/${enc(id)}`,
    reason ? { reason } : undefined,
    "Couldn't remove the expert. Please try again.",
  );
  if (result.success) {
    revalidateTag(TAGS.homeExpert(id), "max");
    revalidateTag(TAGS.ownerHomeServiceBookings(salonId), "max");
    revalidateTag(TAGS.myHomeBookings, "max");
    revalidateTag(TAGS.homeJobs, "max");
  }
  return result;
};
