"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { CursorPage, OwnerPayout, PayoutStatus } from "./money-types";

/**
 * `GET /owner/money/payouts`: the business's payouts, newest first. A server
 * action as well, so "Load more" can ask for the next cursor.
 */
export const getOwnerPayouts = async (
  filters: { status?: PayoutStatus; salonId?: string } = {},
  cursor?: string,
): Promise<ApiResponse<CursorPage<OwnerPayout>>> => {
  try {
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.salonId) query.set("salonId", filters.salonId);
    if (cursor) query.set("cursor", cursor);
    const response = await serverFetch.get(`/owner/money/payouts?${query.toString()}`, {
      next: { revalidate: 60, tags: [TAGS.ownerPayouts, TAGS.earnings] },
    });
    return (await response.json()) as ApiResponse<CursorPage<OwnerPayout>>;
  } catch (error) {
    console.error("getOwnerPayouts error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your payouts.",
    };
  }
};
