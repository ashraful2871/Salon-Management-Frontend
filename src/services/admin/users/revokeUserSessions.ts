"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `POST /admin/users/:id/revoke-sessions`: signs the account out on every device. */
export const revokeUserSessions = async (
  id: string,
  reason?: string,
): Promise<ApiResponse<{ id: string }>> => {
  const result = await adminSend<{ id: string }>(
    "post",
    `/admin/users/${encodeURIComponent(id)}/revoke-sessions`,
    { reason },
    "Couldn't sign them out. Please try again.",
  );
  if (result.success) updateTag(TAGS.adminUser(id));
  return result;
};
