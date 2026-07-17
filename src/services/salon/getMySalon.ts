import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Salon } from "@/lib/api-types";

export const getMySalon = async (): Promise<ApiResponse<Salon[]>> => {
  try {
    const response = await serverFetch.get("/salons/my-salons", {
      next: {
        tags: ["my-salons"],
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
