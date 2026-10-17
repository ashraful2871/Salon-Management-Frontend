import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { TeamMember } from "./team-types";

/** `GET /salons/:salonId/members`. The API 404s anyone without team.invite there. */
export const getSalonMembers = async (salonId: string): Promise<ApiResponse<TeamMember[]>> => {
  try {
    const response = await serverFetch.get(`/salons/${encodeURIComponent(salonId)}/members`, {
      next: { revalidate: 60, tags: [TAGS.salonMembers(salonId)] },
    });
    return (await response.json()) as ApiResponse<TeamMember[]>;
  } catch (error) {
    console.error("getSalonMembers error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load the team.",
    };
  }
};
