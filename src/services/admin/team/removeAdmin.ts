"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `DELETE /admin/team/:userId` (tier 3): back to a customer account, sessions ended. */
export const removeAdmin = async (userId: string, reason: string): Promise<ApiResponse<{ userId: string }>> => {
  const result = await adminSend<{ userId: string }>(
    "delete",
    `/admin/team/${encodeURIComponent(userId)}`,
    { reason },
    "Couldn't remove them from the team. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminTeam);
    updateTag(TAGS.adminUser(userId));
    revalidateTag(TAGS.adminUsers, "max");
  }
  return result;
};
