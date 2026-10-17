import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { OwnerStatementDetail } from "./statement-types";

/** `GET /owner/statements/:id`: one statement for the printable page (404 when not yours). */
export const getOwnerStatement = async (id: string): Promise<ApiResponse<OwnerStatementDetail>> => {
  try {
    // Statements never change once written; the tag covers the header settings.
    const response = await serverFetch.get(`/owner/statements/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600, tags: [TAGS.ownerStatements] },
    });
    return (await response.json()) as ApiResponse<OwnerStatementDetail>;
  } catch (error) {
    console.error("getOwnerStatement error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load this statement.",
    };
  }
};
