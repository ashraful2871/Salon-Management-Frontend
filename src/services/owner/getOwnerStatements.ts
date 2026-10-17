"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { CursorPage } from "./money-types";
import type { OwnerStatementItem, StatementKind } from "./statement-types";

/**
 * `GET /owner/statements`: monthly statements, payout statements and
 * commission invoices, newest first. A server action as well, for "Load more".
 */
export const getOwnerStatements = async (
  kind?: StatementKind,
  cursor?: string,
): Promise<ApiResponse<CursorPage<OwnerStatementItem>>> => {
  try {
    const query = new URLSearchParams();
    if (kind) query.set("kind", kind);
    if (cursor) query.set("cursor", cursor);
    const response = await serverFetch.get(`/owner/statements?${query.toString()}`, {
      next: { revalidate: 300, tags: [TAGS.ownerStatements, TAGS.ownerPayouts] },
    });
    return (await response.json()) as ApiResponse<CursorPage<OwnerStatementItem>>;
  } catch (error) {
    console.error("getOwnerStatements error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your statements.",
    };
  }
};
