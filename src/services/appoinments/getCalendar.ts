import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { CalendarData } from "./calendar-types";

/** One branch's calendar, a day or a week from `from`. */
export const getCalendar = async (params: {
  salonId: string;
  from: string;
  view: "day" | "week";
}): Promise<ApiResponse<CalendarData>> => {
  try {
    const query = new URLSearchParams(params);
    const response = await serverFetch.get(`/appointments/calendar?${query}`, {
      next: { revalidate: 30, tags: [TAGS.appointments, TAGS.slots, TAGS.staffSchedules] },
    });
    return (await response.json()) as ApiResponse<CalendarData>;
  } catch (error) {
    console.error("getCalendar error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load the calendar.",
    };
  }
};
