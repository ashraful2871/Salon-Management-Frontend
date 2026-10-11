"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `POST /admin/team/:userId/reset-mfa` (tier 3): they enrol again at the next sign-in. */
export const resetAdminMfa = async (userId: string, reason: string): Promise<ApiResponse<{ userId: string }>> => {
  const result = await adminSend<{ userId: string }>(
    "post",
    `/admin/team/${encodeURIComponent(userId)}/reset-mfa`,
    { reason },
    "Couldn't reset two-factor sign-in. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminTeam);
    updateTag(TAGS.adminUser(userId));
  }
  return result;
};
