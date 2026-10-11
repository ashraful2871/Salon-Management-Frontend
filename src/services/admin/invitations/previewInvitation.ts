import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { InvitationPreview } from "../types";

/**
 * `GET /invitations/admin/preview`: what the invite page shows. Public, but
 * sent with the session when there is one, so the API can say whether the
 * invitation is for the signed-in account (`forYou`).
 */
export const previewInvitation = async (
  token: string,
): Promise<ApiResponse<InvitationPreview>> => {
  try {
    const response = await serverFetch.get(
      `/invitations/admin/preview?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    return (await response.json()) as ApiResponse<InvitationPreview>;
  } catch (error) {
    console.error("previewInvitation error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load this invitation. Please try again.",
    };
  }
};
