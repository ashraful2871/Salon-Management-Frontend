"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

export type WalletTransaction = {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  heldAfter: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  metadata?: any;
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
