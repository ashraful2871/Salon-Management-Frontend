"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { MyEarnings } from "./settlement-types";

/**
 * The salon owner's Earnings screen. One call, because the cards, the payout
 * table and the per-booking breakdown all have to agree with each other — two
 * calls on two cache entries could show a payout that the totals do not.
 *
 * Tagged `earnings` so a payout run or a settled booking can invalidate it.
 */
export const getMyEarnings = async (
  limit = 20,
): Promise<ApiResponse<MyEarnings>> => {
  try {
    const response = await serverFetch.get(
      `/settlements/my-earnings?limit=${limit}`,
      {
        next: { revalidate: 30, tags: ["earnings", "dashboard-stats"] },
      },
    );

    return await response.json();
  } catch (error) {
    console.error("getMyEarnings error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your earnings.",
    };
  }
};
