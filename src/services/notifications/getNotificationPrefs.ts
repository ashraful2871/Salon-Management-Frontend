import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { NotificationPrefs } from "./notification-types";

/** `GET /owner/notification-prefs`: event × channel, defaults filled in. */
export const getNotificationPrefs = async (): Promise<ApiResponse<NotificationPrefs>> => {
  try {
    const response = await serverFetch.get("/owner/notification-prefs", {
      next: { revalidate: 300, tags: [TAGS.notificationPrefs] },
    });
    return (await response.json()) as ApiResponse<NotificationPrefs>;
  } catch (error) {
    console.error("getNotificationPrefs error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your notification settings.",
    };
  }
};
