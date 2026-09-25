"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, CashSummary } from "@/lib/api-types";

// One day's takings for the owner's salons, or one salon when `salonId` is
// given. `date` is YYYY-MM-DD.
export const getCashSummary = async (params: {
  date: string;
  salonId?: string;
}): Promise<ApiResponse<CashSummary>> => {
  try {
    const qs = new URLSearchParams({ date: params.date });
    if (params.salonId) qs.set("salonId", params.salonId);

    const response = await serverFetch.get(
      `/appointments/cash-summary?${qs.toString()}`,
      { next: { revalidate: 30, tags: ["appointments", "dashboard-stats"] } },
    );

    const result: ApiResponse<CashSummary> = await response.json();
    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("getCashSummary error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load the cash summary.",
    };
  }
};
