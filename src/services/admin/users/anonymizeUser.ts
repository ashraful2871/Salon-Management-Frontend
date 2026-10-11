"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `POST /admin/users/:id/anonymize` (users.delete, tier 3: step-up). */
export const anonymizeUser = async (
  id: string,
  reason: string,
  confirmEmail: string,
): Promise<ApiResponse<{ id: string; status: "DELETED" }>> => {
  const result = await adminSend<{ id: string; status: "DELETED" }>(
    "post",
    `/admin/users/${encodeURIComponent(id)}/anonymize`,
    { reason, confirmEmail },
    "Couldn't anonymize the account. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminUsers);
    updateTag(TAGS.adminUser(id));
  }
  return result;
};
