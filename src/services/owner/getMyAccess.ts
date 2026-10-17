import { cache } from "react";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";

/** One branch the caller works at, and what they may do there. */
export type BranchAccess = {
  salonId: string;
  salonName: string;
  // OWNER at their own salons; a team seat otherwise (STAFF = pre-team staff row).
  role: "OWNER" | "MANAGER" | "RECEPTIONIST" | "STYLIST" | "STAFF";
  permissions: string[];
};

/**
 * `GET /owner/access`: the owner's (or staff member's) branches. The branch
 * switcher and `getSelectedBranch` both read it in one render, hence `cache()`.
 * The backend decides access on every call; this only drives the UI.
 */
export const getMyAccess = cache(
  async (): Promise<ApiResponse<BranchAccess[]>> => {
    try {
      const response = await serverFetch.get("/owner/access", {
        next: { revalidate: 300, tags: [TAGS.ownerAccess] },
      });
      return (await response.json()) as ApiResponse<BranchAccess[]>;
    } catch (error) {
      console.error("getMyAccess error:", error);
      return {
        success: false,
        message:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Failed to load your branches.",
      };
    }
  },
);
