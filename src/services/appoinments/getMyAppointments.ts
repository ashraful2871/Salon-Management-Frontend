import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Appointment } from "@/lib/api-types";

export const getMyAppointments = async (
  salonId?: string,
  status?: string,
): Promise<ApiResponse<Appointment[]>> => {
  try {
    const params = new URLSearchParams();
    if (salonId) params.set("salonId", salonId);
    if (status) params.set("status", status);

    const url = `/appointments/my-appointments?${params.toString()}`;
    const response = await serverFetch.get(url, {
      next: {
        revalidate: 30,
        tags: ["my-appointments"],
      },
    });

    const result: ApiResponse<Appointment[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getMyAppointments error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load appointments.",
    };
  }
};
