"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

export type ChangeableRole = "CUSTOMER" | "STAFF" | "SALON_OWNER";

/** `PATCH /admin/users/:id/role` (tier 3: step-up). Never to or from ADMIN or AGENT. */
export const updateUserRole = async (
  id: string,
  role: ChangeableRole,
  reason: string,
): Promise<ApiResponse<{ id: string; role: ChangeableRole }>> => {
  const result = await adminSend<{ id: string; role: ChangeableRole }>(
    "patch",
    `/admin/users/${encodeURIComponent(id)}/role`,
    { role, reason },
    "Couldn't change the account type. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminUsers);
    updateTag(TAGS.adminUser(id));
  }
  return result;
};
