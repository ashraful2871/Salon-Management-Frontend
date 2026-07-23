import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, SalonService } from "@/lib/api-types";

export const getMyServices = async (
  salonId?: string,
): Promise<ApiResponse<SalonService[]>> => {
  try {
    const url = salonId
      ? `/services/my-services?salonId=${salonId}`
      : "/services/my-services";
    const response = await serverFetch.get(url, {
      next: {
        tags: ["my-services"],
      },
    });

    const result: ApiResponse<SalonService[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getMyServices error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load services.",
    };
  }
};
