"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `POST /admin/users/:id/verify-email` (tier 3: step-up). */
export const verifyUserEmail = async (id: string, reason: string): Promise<ApiResponse<{ id: string }>> => {
  const result = await adminSend<{ id: string }>(
    "post",
    `/admin/users/${encodeURIComponent(id)}/verify-email`,
    { reason },
    "Couldn't mark the email verified. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminUsers);
    updateTag(TAGS.adminUser(id));
  }
  return result;
};
