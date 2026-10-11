"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `POST /admin/team/invitations/:id/revoke` (tier 3). */
export const revokeAdminInvitation = async (id: string): Promise<ApiResponse<{ id: string }>> => {
  const result = await adminSend<{ id: string }>(
    "post",
    `/admin/team/invitations/${encodeURIComponent(id)}/revoke`,
    undefined,
    "Couldn't revoke the invitation.",
  );
  if (result.success) updateTag(TAGS.adminTeam);
  return result;
};
