import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { TeamInvitation } from "./team-types";

/** `GET /salons/:salonId/invitations`: pending ones (a manager sees only those they sent). */
export const getSalonInvitations = async (
  salonId: string,
): Promise<ApiResponse<TeamInvitation[]>> => {
  try {
    const response = await serverFetch.get(`/salons/${encodeURIComponent(salonId)}/invitations`, {
      next: { revalidate: 60, tags: [TAGS.salonInvitations(salonId)] },
    });
    return (await response.json()) as ApiResponse<TeamInvitation[]>;
  } catch (error) {
    console.error("getSalonInvitations error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load the invitations.",
    };
  }
};
