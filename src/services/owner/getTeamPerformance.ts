import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { TeamPerformance } from "@/services/staff/schedule-types";

/** `GET /owner/team/performance?salonId&from&to` (reports.view scope). */
export const getTeamPerformance = async (params: {
  salonId?: string;
  from?: string;
  to?: string;
}): Promise<ApiResponse<TeamPerformance>> => {
  try {
    const query = new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => !!e[1]),
    );
    const response = await serverFetch.get(`/owner/team/performance?${query}`, {
      next: { revalidate: 120, tags: [TAGS.teamPerformance, TAGS.appointments] },
    });
    return (await response.json()) as ApiResponse<TeamPerformance>;
  } catch (error) {
    console.error("getTeamPerformance error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load team performance.",
    };
  }
};
