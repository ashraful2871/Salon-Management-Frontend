"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { AdminRoleName } from "./types";

/** `PATCH /admin/team/:userId` (tier 3). The last super admin can't be demoted (409). */
export const changeAdminRole = async (
  userId: string,
  adminRole: AdminRoleName,
  reason: string,
): Promise<ApiResponse<{ userId: string }>> => {
  const result = await adminSend<{ userId: string }>(
    "patch",
    `/admin/team/${encodeURIComponent(userId)}`,
    { adminRole, reason },
    "Couldn't change the role. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminTeam);
    updateTag(TAGS.adminUser(userId));
  }
  return result;
};
