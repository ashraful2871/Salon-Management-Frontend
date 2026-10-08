"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { InvitationResult } from "../agents/types";

/** `POST /admin/team/invitations/:id/resend` (tier 3). */
export const resendAdminInvitation = async (id: string): Promise<ApiResponse<InvitationResult>> => {
  const result = await adminSend<InvitationResult>(
    "post",
    `/admin/team/invitations/${encodeURIComponent(id)}/resend`,
    undefined,
    "Couldn't resend the invitation.",
  );
  if (result.success) updateTag(TAGS.adminTeam);
  return result;
};
