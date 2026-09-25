import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";

export type AppointmentListParams = {
  date?: string;
  status?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
};

export const getAllAppointments = async (
  params: AppointmentListParams = {},
): Promise<ApiResponse<Appointment[]>> => {
  try {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }
    const qs = query.toString();

    const response = await serverFetch.get(
      `/appointments${qs ? `?${qs}` : ""}`,
      {
        next: {
          revalidate: 30,
          tags: ["appointments"],
        },
      },
    );

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
