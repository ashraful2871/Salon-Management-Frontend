"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

/**
 * Mirrors `WalletService.getWalletSummary`. The ledger columns hold poisha, so
 * the summary projects them under `Minor` names and `addTakaFields` adds the
 * taka twins below. Render from the `Minor` fields — `formatBDT` already
 * divides by 100, so formatting a taka field renders it 100x too small.
 */
export type Wallet = {
  id: string;
  currency: string;
  isFrozen: boolean;
  balanceMinor: number;
  heldBalanceMinor: number;
  availableMinor: number;
  /** Taka twins added by `addTakaFields`. For display use the `Minor` fields. */
  balance: number;
  heldBalance: number;
  available: number;
};

export const getMyWallet = async (): Promise<ApiResponse<Wallet>> => {
  try {
    const response = await serverFetch.get("/wallet/me");
    return await response.json();
  } catch (error) {
    console.error("getMyWallet error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to fetch wallet.",
    };
  }
};
