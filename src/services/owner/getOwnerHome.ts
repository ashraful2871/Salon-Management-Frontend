import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { OwnerHomeData } from "./home-types";

/**
 * `GET /owner/home`: needs attention, today, setup, week vs last, branches.
 * Every booking mutation expires `TAGS.ownerHomes`; `dashboardStats` rides
 * along so anything that already refreshes Home refreshes this too.
 */
export const getOwnerHome = async (salonId?: string): Promise<ApiResponse<OwnerHomeData>> => {
  try {
    const query = salonId ? `?salonId=${encodeURIComponent(salonId)}` : "";
    const response = await serverFetch.get(`/owner/home${query}`, {
      next: {
        revalidate: 60,
        tags: [TAGS.ownerHome(salonId ?? "all"), TAGS.ownerHomes, TAGS.dashboardStats],
      },
    });
    return (await response.json()) as ApiResponse<OwnerHomeData>;
  } catch (error) {
    console.error("getOwnerHome error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your home page.",
    };
  }
};
