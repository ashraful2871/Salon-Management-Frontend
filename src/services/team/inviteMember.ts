"use server";

import { updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { BranchRole, InviteResult } from "./team-types";

/** `POST /salons/:salonId/invitations`: emails a link to `/invite?token=`. */
export const inviteMember = async (
  salonId: string,
  input: { email: string; name?: string; role: BranchRole },
): Promise<ApiResponse<InviteResult>> => {
  try {
    const response = await serverFetch.post(`/salons/${encodeURIComponent(salonId)}/invitations`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, name: input.name?.trim() || undefined }),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<InviteResult>;
    if (result.success) updateTag(TAGS.salonInvitations(salonId));
    return result;
  } catch (error) {
    console.error("inviteMember error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't send the invitation. Please try again.",
    };
  }
};
