"use server";

import { updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";

/** `PATCH /owner/notifications/read`: some rows (`ids`) or every unread one. */
export const markNotificationsRead = async (
  target: { ids: string[] } | { all: true },
): Promise<ApiResponse<{ updated: number; unread: number }>> => {
  try {
    const response = await serverFetch.patch("/owner/notifications/read", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<{ updated: number; unread: number }>;
    if (result.success) updateTag(TAGS.notifications);
    return result;
  } catch (error) {
    console.error("markNotificationsRead error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't mark them as read. Please try again.",
    };
  }
};
