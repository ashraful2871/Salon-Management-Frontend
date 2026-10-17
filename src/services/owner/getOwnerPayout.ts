import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { OwnerPayoutDetail } from "./money-types";

/** `GET /owner/money/payouts/:id`: one payout and its lines by branch (404 when not yours). */
export const getOwnerPayout = async (id: string): Promise<ApiResponse<OwnerPayoutDetail>> => {
  try {
    const response = await serverFetch.get(`/owner/money/payouts/${encodeURIComponent(id)}`, {
      next: { revalidate: 60, tags: [TAGS.ownerPayouts, TAGS.earnings] },
    });
    return (await response.json()) as ApiResponse<OwnerPayoutDetail>;
  } catch (error) {
    console.error("getOwnerPayout error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load this payout.",
    };
  }
};
