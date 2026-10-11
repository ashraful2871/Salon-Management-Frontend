"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { InvitationResult } from "../agents/types";
import type { AdminRoleName } from "./types";

/** `POST /admin/team/invitations` (tier 3: step-up). */
export const inviteAdmin = async (input: {
  email: string;
  name?: string;
  adminRole: AdminRoleName;
}): Promise<ApiResponse<InvitationResult>> => {
  const result = await adminSend<InvitationResult>(
    "post",
    "/admin/team/invitations",
    input,
    "Couldn't send the invitation. Please try again.",
  );
  if (result.success) updateTag(TAGS.adminTeam);
  return result;
};
