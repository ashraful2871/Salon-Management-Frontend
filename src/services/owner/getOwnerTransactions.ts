"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { transactionsQuery, type CursorPage, type OwnerTransaction, type TransactionFilters } from "./money-types";

/**
 * `GET /owner/money/transactions`: SALON_PAYABLE lines, newest first. A
 * server action as well, so "Load more" can ask for the next cursor.
 */
export const getOwnerTransactions = async (
  filters: TransactionFilters,
  cursor?: string,
): Promise<ApiResponse<CursorPage<OwnerTransaction>>> => {
  try {
    const query = transactionsQuery(filters, cursor);
    const response = await serverFetch.get(`/owner/money/transactions?limit=25&${query}`, {
      next: { revalidate: 60, tags: [TAGS.ownerMoney, TAGS.earnings] },
    });
    return (await response.json()) as ApiResponse<CursorPage<OwnerTransaction>>;
  } catch (error) {
    console.error("getOwnerTransactions error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your transactions.",
    };
  }
};
