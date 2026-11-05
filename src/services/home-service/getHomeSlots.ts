"use server";

import type { ApiResponse } from "@/lib/api-types";
import { getHomeAvailability } from "./getHomeAvailability";
import { getHomeDays } from "./getHomeDays";
import type { HomeAvailability, HomeAvailabilityQuery, HomeDays } from "./types";

/**
 * The window's day chips and/or one day's open times in one Server Action.
 * The browser runs Server Actions one at a time, so separate days and times
 * calls would queue behind each other; here both API reads go out together.
 * Each part is present only when asked for. Never cached.
 */
export const getHomeSlots = async (
  q: HomeAvailabilityQuery & { days: boolean; date: string | null },
): Promise<{ days?: ApiResponse<HomeDays>; times?: ApiResponse<HomeAvailability> }> => {
  const { days, date, ...source } = q;
  const [daysRes, timesRes] = await Promise.all([
    days ? getHomeDays(source) : undefined,
    date ? getHomeAvailability({ ...source, date }) : undefined,
  ]);
  return { days: daysRes, times: timesRes };
};
