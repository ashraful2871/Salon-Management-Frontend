import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Salon } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";

export const getMySalon = async (): Promise<ApiResponse<Salon[]>> => {
  try {
    const response = await serverFetch.get("/salons/my-salons", {
      next: {
        tags: [TAGS.mySalons],
      },
    });

    const result: ApiResponse<Salon[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getMySalon error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your salons.",
    };
  }
};
