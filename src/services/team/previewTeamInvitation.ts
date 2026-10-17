import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { TeamInvitationPreview } from "./team-types";

/**
 * `GET /invitations/preview?token=`: public, sent with the session when there
 * is one, so the API can say whether the invitation is for this account.
 */
export const previewTeamInvitation = async (
  token: string,
): Promise<ApiResponse<TeamInvitationPreview>> => {
  try {
    const response = await serverFetch.get(
      `/invitations/preview?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    return (await response.json()) as ApiResponse<TeamInvitationPreview>;
  } catch (error) {
    console.error("previewTeamInvitation error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load this invitation. Please try again.",
    };
  }
};
