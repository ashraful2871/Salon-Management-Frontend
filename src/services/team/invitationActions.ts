"use server";

import { updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { InviteResult } from "./team-types";

const failure = (error: unknown, fallback: string): ApiResponse<never> => ({
  success: false,
  message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

/** `POST /invitations/:id/resend`: a new link and a fresh 7 days. */
export const resendInvitation = async (
  salonId: string,
  invitationId: string,
): Promise<ApiResponse<InviteResult>> => {
  try {
    const response = await serverFetch.post(
      `/invitations/${encodeURIComponent(invitationId)}/resend`,
      { cache: "no-store" },
    );
    const result = (await response.json()) as ApiResponse<InviteResult>;
    if (result.success) updateTag(TAGS.salonInvitations(salonId));
    return result;
  } catch (error) {
    console.error("resendInvitation error:", error);
    return failure(error, "Couldn't resend the invitation. Please try again.");
  }
};

/** `DELETE /invitations/:id`: the link stops working. */
export const revokeInvitation = async (
  salonId: string,
  invitationId: string,
): Promise<ApiResponse> => {
  try {
    const response = await serverFetch.delete(`/invitations/${encodeURIComponent(invitationId)}`, {
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse;
    if (result.success) updateTag(TAGS.salonInvitations(salonId));
    return result;
  } catch (error) {
    console.error("revokeInvitation error:", error);
    return failure(error, "Couldn't revoke the invitation. Please try again.");
  }
};
