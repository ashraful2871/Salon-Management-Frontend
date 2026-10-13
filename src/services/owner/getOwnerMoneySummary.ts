import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { OwnerMoneySummary } from "./money-types";

/**
 * `GET /owner/money/summary`: the balance buckets, last payout, payout
 * account and the six-month trend. Tagged `earnings` too, so every booking
 * and payout mutation that already expires earnings expires this. `fresh`
 * skips the cache: a dues payment settles on the backend, which cannot expire
 * a Next tag, so the return from the gateway reads it uncached.
 */
export const getOwnerMoneySummary = async (
  salonId?: string,
  opts: { fresh?: boolean } = {},
): Promise<ApiResponse<OwnerMoneySummary>> => {
  try {
    const query = salonId ? `?salonId=${encodeURIComponent(salonId)}` : "";
    const response = await serverFetch.get(
      `/owner/money/summary${query}`,
      opts.fresh
        ? { cache: "no-store" }
        : {
            next: {
              revalidate: 60,
              tags: [TAGS.ownerMoney, TAGS.earnings, TAGS.payoutAccounts],
            },
          },
    );
    return (await response.json()) as ApiResponse<OwnerMoneySummary>;
  } catch (error) {
    console.error("getOwnerMoneySummary error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your money summary.",
    };
  }
};
