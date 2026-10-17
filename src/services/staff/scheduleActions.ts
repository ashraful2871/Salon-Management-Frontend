"use server";

import { revalidateTag, updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { AddedTimeOff, StaffShift, StaffShifts } from "./schedule-types";

const failure = (error: unknown, fallback: string): ApiResponse<never> => ({
  success: false,
  message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

// The sheet shows the change now; the calendar and performance pick it up later.
const expire = (staffId: string) => {
  updateTag(TAGS.staffSchedule(staffId));
  revalidateTag(TAGS.staffSchedules, "max");
  revalidateTag(TAGS.teamPerformance, "max");
};

/** `PUT /staff/:id/shifts`: replaces the week. An empty list = whenever the salon is open. */
export const saveStaffShifts = async (
  staffId: string,
  shifts: StaffShift[],
): Promise<ApiResponse<StaffShifts>> => {
  try {
    const response = await serverFetch.put(`/staff/${encodeURIComponent(staffId)}/shifts`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shifts }),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<StaffShifts>;
    if (result.success) expire(staffId);
    return result;
  } catch (error) {
    console.error("saveStaffShifts error:", error);
    return failure(error, "Couldn't save the hours. Please try again.");
  }
};

/** `POST /staff/:id/time-off`. Instants with their offset, e.g. "2026-10-20T00:00:00+06:00". */
export const addStaffTimeOff = async (
  staffId: string,
  body: { startsAt: string; endsAt: string; reason?: string },
): Promise<ApiResponse<AddedTimeOff>> => {
  try {
    const response = await serverFetch.post(`/staff/${encodeURIComponent(staffId)}/time-off`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<AddedTimeOff>;
    if (result.success) expire(staffId);
    return result;
  } catch (error) {
    console.error("addStaffTimeOff error:", error);
    return failure(error, "Couldn't add the time off. Please try again.");
  }
};

/** `DELETE /staff/:id/time-off/:timeOffId`. */
export const deleteStaffTimeOff = async (
  staffId: string,
  timeOffId: string,
): Promise<ApiResponse<{ id: string }>> => {
  try {
    const response = await serverFetch.delete(
      `/staff/${encodeURIComponent(staffId)}/time-off/${encodeURIComponent(timeOffId)}`,
      { cache: "no-store" },
    );
    const result = (await response.json()) as ApiResponse<{ id: string }>;
    if (result.success) expire(staffId);
    return result;
  } catch (error) {
    console.error("deleteStaffTimeOff error:", error);
    return failure(error, "Couldn't remove the time off. Please try again.");
  }
};
