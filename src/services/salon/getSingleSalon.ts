import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Salon } from "@/lib/api-types";

export const getSingleSalon = async (
  id: string,
): Promise<ApiResponse<Salon>> => {
  try {
    const response = await serverFetch.get(`/salons/${id}`, {
      next: {
        revalidate: 60,
        tags: [`salon-${id}`, "salons"],
      },
    });

    const result: ApiResponse<Salon> = await response.json();
    return result;
  } catch (error) {
    console.error("getSingleSalon error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load salon details.",
    };
  }
};
