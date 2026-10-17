"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { StaffAvailability } from "./schedule-types";

/** `GET /staff/availability`: who of the branch's stylists works this booking's time. */
export const getStaffAvailability = async (
  appointmentId: string,
): Promise<ApiResponse<StaffAvailability[]>> => {
  try {
    const response = await serverFetch.get(
      `/staff/availability?appointmentId=${encodeURIComponent(appointmentId)}`,
      { cache: "no-store" },
    );
    return (await response.json()) as ApiResponse<StaffAvailability[]>;
  } catch (error) {
    console.error("getStaffAvailability error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't check who is working.",
    };
  }
};
