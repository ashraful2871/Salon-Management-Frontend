"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { NotificationPage } from "./notification-types";

/**
 * `GET /owner/notifications`: the caller's own rows, newest first, plus the
 * unread count. A server action too: the bell polls it and "Load more" pages it.
 */
export const getNotifications = async (
  opts: { cursor?: string; limit?: number; unread?: boolean } = {},
): Promise<ApiResponse<NotificationPage>> => {
  try {
    const query = new URLSearchParams();
    if (opts.cursor) query.set("cursor", opts.cursor);
    if (opts.limit) query.set("limit", String(opts.limit));
    if (opts.unread) query.set("unread", "1");
    const response = await serverFetch.get(`/owner/notifications?${query.toString()}`, {
      next: { revalidate: 30, tags: [TAGS.notifications] },
    });
    return (await response.json()) as ApiResponse<NotificationPage>;
  } catch (error) {
    console.error("getNotifications error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load notifications.",
    };
  }
};
