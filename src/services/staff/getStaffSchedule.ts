"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { StaffShifts, StaffTimeOff } from "./schedule-types";

/**
 * A stylist's weekly hours and time off, for the Team page's Hours sheet. A
 * server action: the sheet is a client component and `serverFetch` needs the
 * httpOnly cookie. The API answers 404 without staff.manage at their branch.
 */
export const getStaffSchedule = async (
  staffId: string,
): Promise<ApiResponse<{ hours: StaffShifts; timeOff: StaffTimeOff[] }>> => {
  try {
    const id = encodeURIComponent(staffId);
    const opts = { next: { revalidate: 60, tags: [TAGS.staffSchedule(staffId)] } };
    const [hours, timeOff] = await Promise.all([
      serverFetch.get(`/staff/${id}/shifts`, opts).then((r) => r.json() as Promise<ApiResponse<StaffShifts>>),
      serverFetch
        .get(`/staff/${id}/time-off`, opts)
        .then((r) => r.json() as Promise<ApiResponse<StaffTimeOff[]>>),
    ]);
    if (!hours.success || !hours.data) return { success: false, message: hours.message };
    if (!timeOff.success) return { success: false, message: timeOff.message };
    return { success: true, message: "Schedule", data: { hours: hours.data, timeOff: timeOff.data ?? [] } };
  } catch (error) {
    console.error("getStaffSchedule error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load working hours.",
    };
  }
};
