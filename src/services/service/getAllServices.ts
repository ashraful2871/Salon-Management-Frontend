import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, SalonService } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";

export const getAllServices = async (
  salonId?: string,
): Promise<ApiResponse<SalonService[]>> => {
  try {
    const url = salonId ? `/services?salonId=${salonId}` : "/services";
    const response = await serverFetch.get(url, {
      next: {
        revalidate: 60,
        tags: [TAGS.services],
      },
    });

    const result: ApiResponse<SalonService[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getAllServices error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load services.",
    };
  }
};
