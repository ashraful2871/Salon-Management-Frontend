"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

/**
 * Mirrors `WalletService.serializeTransaction`. The signed poisha arrives as
 * `amountMinor` / `balanceAfterMinor` / `heldAfterMinor`; `addTakaFields` adds
 * the taka twins below. Render from the `Minor` fields — `formatBDT` divides by
 * 100 itself, so formatting a taka field renders it 100x too small.
 */
export type WalletTransaction = {
  id: string;
  walletId: string;
  type: string;
  amountMinor: number;
  balanceAfterMinor: number;
  heldAfterMinor: number;
  /** Taka twins added by `addTakaFields`. For display use the `Minor` fields. */
  amount: number;
  balanceAfter: number;
  heldAfter: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  /**
   * `holdDeltaMinor` is the signed poisha a DEPOSIT_HOLD / DEPOSIT_RELEASE
   * moved in or out of `heldBalance`. Those rows carry `amountMinor: 0`
   * because a hold does not change the total balance, so this is the only
   * amount worth showing for them.
   */
  metadata?: { holdDeltaMinor?: number } & Record<string, unknown>;
  createdAt: string;
};

export const getTransactions = async (
  page = 1,
  limit = 20
): Promise<ApiResponse<WalletTransaction[]>> => {
  try {
    const response = await serverFetch.get(`/wallet/me/transactions?page=${page}&limit=${limit}`);
    return await response.json();
  } catch (error) {
    console.error("getTransactions error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to fetch transactions.",
    };
  }
};
