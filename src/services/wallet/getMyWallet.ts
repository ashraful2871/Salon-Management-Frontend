"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

export type Wallet = {
  id: string;
  userId: string;
  balance: number;
  heldBalance: number;
  currency: string;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
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
