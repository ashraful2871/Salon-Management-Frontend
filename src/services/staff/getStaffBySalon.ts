import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, StaffMember } from "@/lib/api-types";

export const getStaffBySalon = async (
  salonId: string,
): Promise<ApiResponse<StaffMember[]>> => {
  try {
    const response = await serverFetch.get(`/staff?salonId=${salonId}`, {
      next: {
        revalidate: 60,
        tags: [`staff-${salonId}`],
      },
    });

    const result: ApiResponse<StaffMember[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getStaffBySalon error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load staff.",
    };
  }
};
