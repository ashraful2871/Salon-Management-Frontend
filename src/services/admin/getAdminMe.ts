import { cache } from "react";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AdminMe } from "./types";

/**
 * `GET /admin/me`: the caller's admin role, permissions and 2FA state. Wrapped
 * in `cache()` so the dashboard layout, the admin layout and a page can all
 * ask within one render for the price of one request. Never HTTP-cached: the
 * 2FA state changes the moment enrolment finishes.
 */
export const getAdminMe = cache(async (): Promise<ApiResponse<AdminMe>> => {
  try {
    const response = await serverFetch.get("/admin/me", { cache: "no-store" });
    return (await response.json()) as ApiResponse<AdminMe>;
  } catch (error) {
    console.error("getAdminMe error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your admin profile.",
    };
  }
});
