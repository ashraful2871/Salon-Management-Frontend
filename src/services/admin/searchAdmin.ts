"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AdminSearchHit } from "./types";

/**
 * `GET /admin/search?q=`: users by email/phone/name, salons, bookings by
 * `TKN-…`, top-up intents and payouts by id. The command palette calls this
 * as a Server Action, debounced, so it is never cached.
 */
export const searchAdmin = async (q: string): Promise<ApiResponse<AdminSearchHit[]>> => {
  const term = q.trim().slice(0, 100);
  if (!term) return { success: true, message: "Search results", data: [] };

  try {
    const response = await serverFetch.get(`/admin/search?q=${encodeURIComponent(term)}`, {
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<AdminSearchHit[]>;
  } catch (error) {
    console.error("searchAdmin error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Search is unavailable right now.",
    };
  }
};
