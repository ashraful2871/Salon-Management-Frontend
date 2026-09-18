"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { PlatformEarnings } from "./settlement-types";

/** The platform's own side of the ledger. ADMIN only. */
export const getPlatformEarnings = async (): Promise<
  ApiResponse<PlatformEarnings>
> => {
  try {
    const response = await serverFetch.get("/settlements/platform-earnings", {
      next: { revalidate: 30, tags: ["earnings", "dashboard-stats"] },
    });

    return await response.json();
  } catch (error) {
    console.error("getPlatformEarnings error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load platform earnings.",
    };
  }
};
