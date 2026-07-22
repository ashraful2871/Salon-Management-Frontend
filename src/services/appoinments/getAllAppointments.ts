import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";

export const getAllAppointments =
  async (): Promise<ApiResponse<Appointment[]>> => {
    try {
      const response = await serverFetch.get("/appointments", {
        next: {
          revalidate: 30,
          tags: ["appointments"],
        },
      });

      const result: ApiResponse<Appointment[]> = await response.json();
      return result;
    } catch (error) {
      console.error("getAllAppointments error:", error);
      return {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Failed to load appointments.",
      };
    }
  };
