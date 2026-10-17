"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { ActivityFilters, ActivityPage } from "./activity-types";

/** `GET /owner/activity`. A server action as well, for "Load more". */
export const getOwnerActivity = async (
  filters: ActivityFilters,
  cursor?: string,
): Promise<ApiResponse<ActivityPage>> => {
  try {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
    if (cursor) query.set("cursor", cursor);
    const response = await serverFetch.get(`/owner/activity?${query.toString()}`, {
      next: { revalidate: 60, tags: [TAGS.ownerActivity] },
    });
    return (await response.json()) as ApiResponse<ActivityPage>;
  } catch (error) {
    console.error("getOwnerActivity error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load activity.",
    };
  }
};
