"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { InvitationResult } from "./types";

/** `POST /admin/agents/invitations/:id/resend`: a fresh link; the old one stops working. */
export const resendAgentInvitation = async (id: string): Promise<ApiResponse<InvitationResult>> => {
  const result = await adminSend<InvitationResult>(
    "post",
    `/admin/agents/invitations/${encodeURIComponent(id)}/resend`,
    undefined,
    "Couldn't resend the invitation.",
  );
  if (result.success) updateTag(TAGS.adminAgents);
  return result;
};
