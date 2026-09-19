"use server";

/**
 * A server action, not a plain helper. Its only caller is a client component,
 * and `serverFetch` authenticates by attaching the httpOnly `accessToken`
 * cookie as a `Cookie` header - something the browser silently strips from any
 * fetch it makes itself, so run from the client this reached the API as an
 * anonymous request. The directive moves the call back to the server, where the
 * cookie and the token renewal that goes with it actually exist.
 */
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
