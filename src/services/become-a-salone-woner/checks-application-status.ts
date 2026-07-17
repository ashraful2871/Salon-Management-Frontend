import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, ApplicationData } from "@/lib/api-types";

export const checkApplicationsStatus =
  async (): Promise<ApiResponse<ApplicationData>> => {
    try {
      const response = await serverFetch.get("/become-salon-owner/me", {
        next: {
          revalidate: 30,
          tags: ["applications-status"],
        },
      });

      const result: ApiResponse<ApplicationData> = await response.json();
      return result;
    } catch (error) {
      console.error("checkApplicationsStatus error:", error);
      return {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Failed to check application status.",
      };
    }
  };
