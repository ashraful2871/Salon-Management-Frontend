import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, SalonApplication } from "@/lib/api-types";

export const salonApplications =
  async (): Promise<ApiResponse<SalonApplication[]>> => {
    try {
      const response = await serverFetch.get(
        "/become-salon-owner/applications",
        {
          next: {
            revalidate: 30,
            tags: ["salon-applications"],
          },
        },
      );

      const result: ApiResponse<SalonApplication[]> = await response.json();
      return result;
    } catch (error) {
      console.error("salonApplications error:", error);
      return {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Failed to load applications.",
      };
    }
  };
