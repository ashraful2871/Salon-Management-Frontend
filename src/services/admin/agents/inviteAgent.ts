"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { InvitationResult } from "./types";

/** `POST /admin/agents/invitations`: emails an invitation scoped to one area. */
export const inviteAgent = async (input: {
  email: string;
  name?: string;
  division: string;
  district: string;
  area: string;
}): Promise<ApiResponse<InvitationResult>> => {
  const result = await adminSend<InvitationResult>(
    "post",
    "/admin/agents/invitations",
    input,
    "Couldn't send the invitation. Please try again.",
  );
  if (result.success) updateTag(TAGS.adminAgents);
  return result;
};
