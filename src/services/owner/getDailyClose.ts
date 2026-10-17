"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { DailyCloseDay, DailyCloseRow } from "./daily-close-types";

const failure = (error: unknown, fallback: string): ApiResponse<never> => ({
  success: false,
  message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
});

/**
 * `GET /owner/daily-close?salonId&date`: what the counter should hold for that
 * Dhaka day, and the close if one was submitted. Never cached - every checkout
 * moves the expected figures.
 */
export const getDailyClose = async (
  salonId: string,
  date: string,
): Promise<ApiResponse<DailyCloseDay>> => {
  try {
    const query = new URLSearchParams({ salonId, date });
    const response = await serverFetch.get(`/owner/daily-close?${query}`, { cache: "no-store" });
    return (await response.json()) as ApiResponse<DailyCloseDay>;
  } catch (error) {
    console.error("getDailyClose error:", error);
    return failure(error, "Failed to load the daily close.");
  }
};

/** `GET /owner/daily-close/history?salonId`: the last 30 closes in scope. */
export const getDailyCloseHistory = async (
  salonId?: string,
): Promise<ApiResponse<{ items: DailyCloseRow[] }>> => {
  try {
    const query = salonId ? `?salonId=${encodeURIComponent(salonId)}` : "";
    const response = await serverFetch.get(`/owner/daily-close/history${query}`, {
      next: { revalidate: 60, tags: [TAGS.ownerDailyClose] },
    });
    return (await response.json()) as ApiResponse<{ items: DailyCloseRow[] }>;
  } catch (error) {
    console.error("getDailyCloseHistory error:", error);
    return failure(error, "Failed to load past closes.");
  }
};
