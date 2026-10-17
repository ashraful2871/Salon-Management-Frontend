"use server";

import { updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { BookingEmailMode, NotificationPrefs } from "./notification-types";

const failure = (error: unknown, fallback: string) => ({
  success: false as const,
  message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

/** `PUT /owner/notification-prefs`: the rows that changed. */
export const saveNotificationPrefs = async (
  prefs: { event: string; email: boolean; inApp: boolean }[],
): Promise<ApiResponse<NotificationPrefs>> => {
  try {
    const response = await serverFetch.put("/owner/notification-prefs", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefs }),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<NotificationPrefs>;
    if (result.success) updateTag(TAGS.notificationPrefs);
    return result;
  } catch (error) {
    console.error("saveNotificationPrefs error:", error);
    return failure(error, "Couldn't save your notification settings. Please try again.");
  }
};

/** `PATCH /owner/booking-email-mode` (owners only). */
export const setBookingEmailMode = async (
  mode: BookingEmailMode,
): Promise<ApiResponse<{ bookingEmailMode: BookingEmailMode }>> => {
  try {
    const response = await serverFetch.patch("/owner/booking-email-mode", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<{ bookingEmailMode: BookingEmailMode }>;
    if (result.success) updateTag(TAGS.notificationPrefs);
    return result;
  } catch (error) {
    console.error("setBookingEmailMode error:", error);
    return failure(error, "Couldn't change booking emails. Please try again.");
  }
};
