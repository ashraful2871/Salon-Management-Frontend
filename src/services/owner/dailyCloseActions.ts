"use server";

import { revalidateTag, updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { DailyCloseRow } from "./daily-close-types";

const failure = (error: unknown, fallback: string): ApiResponse<never> => ({
  success: false,
  message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

// The desk is looking at the close page; reports and activity catch up behind.
const expireCloses = () => {
  updateTag(TAGS.ownerDailyClose);
  revalidateTag(TAGS.ownerReports, "max");
  revalidateTag(TAGS.ownerActivity, "max");
};

/** `POST /owner/daily-close`: one per branch per day; a second answers 409. */
export const submitDailyClose = async (body: {
  salonId: string;
  date: string;
  countedCashMinor: number;
  note?: string;
}): Promise<ApiResponse<DailyCloseRow>> => {
  try {
    const response = await serverFetch.post("/owner/daily-close", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<DailyCloseRow>;
    if (result.success) expireCloses();
    return result;
  } catch (error) {
    console.error("submitDailyClose error:", error);
    return failure(error, "Couldn't close the day. Please try again.");
  }
};

/** `DELETE /owner/daily-close/:id { reason }`: the owner reopens a day (audited). */
export const reopenDailyClose = async (
  id: string,
  reason: string,
): Promise<ApiResponse<{ id: string }>> => {
  try {
    const response = await serverFetch.delete(`/owner/daily-close/${encodeURIComponent(id)}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<{ id: string }>;
    if (result.success) expireCloses();
    return result;
  } catch (error) {
    console.error("reopenDailyClose error:", error);
    return failure(error, "Couldn't reopen the day. Please try again.");
  }
};
