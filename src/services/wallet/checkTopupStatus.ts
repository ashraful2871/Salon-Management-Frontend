"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

export type TopupIntentStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

/**
 * Mirrors `PaymentIntentService.getIntentStatus`. Everything the payment result
 * page shows comes from here, so the poll is also the receipt: render money
 * from the `Minor` fields — `formatBDT` divides by 100 itself.
 */
export type TopupStatus = {
  transactionId: string;
  purpose: "WALLET_TOPUP" | "BOOKING";
  status: TopupIntentStatus;
  amountMinor: number;
  /** Available balance the wallet holds right now, after this top-up landed. */
  walletAvailableMinor: number;
  provider: "SSLCOMMERZ" | "BKASH" | string;
  /** The gateway's own label for the instrument used — "BKASH", "VISA", … */
  method: string | null;
  /** SSLCommerz bank_tran_id or bKash trxID: the reference their support desk asks for. */
  gatewayRef: string | null;
  failureReason: string | null;
  completedAt: string | null;
  createdAt: string;
  /** Taka twins added by `addTakaFields`. For display use the `Minor` fields. */
  amount: number;
  walletAvailable: number;
};

export const checkTopupStatus = async (
  transactionId: string
): Promise<ApiResponse<TopupStatus>> => {
  try {
    const response = await serverFetch.get(
      `/wallet/topup/${encodeURIComponent(transactionId)}`,
      { cache: "no-store" }
    );
    return await response.json();
  } catch (error) {
    console.error("checkTopupStatus error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to check top-up status.",
    };
  }
};
