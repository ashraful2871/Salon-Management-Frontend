"use server";

import { revalidateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

export type RefundTopupResult = {
  refundedMinor: number;
  remainingMinor: number;
  /** UNKNOWN: the wallet was debited but the gateway never confirmed. */
  status: "COMPLETED" | "UNKNOWN";
  refundRef: string | null;
};

/**
 * Sends a top-up, or part of it, back to the customer's bKash or card.
 * `amount` is in taka; leaving it out refunds everything still left.
 */
export const refundTopup = async (
  intentId: string,
  payload: { amount?: number; reason: string },
): Promise<ApiResponse<RefundTopupResult>> => {
  try {
    const response = await serverFetch.post(
      `/payments/admin/intents/${encodeURIComponent(intentId)}/refund`,
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const result: ApiResponse<RefundTopupResult> = await response.json();
    return result;
  } catch (error) {
    console.error("refundTopup error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to send the refund.",
    };
  } finally {
    // A refused refund still writes a reversal and its undo, and a failed
    // request may have reached the API, so the list is stale either way.
    revalidateTag("admin-topups", "seconds");
  }
};
