"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { SettingChange } from "./types";

/** `GET /admin/settings/:key/history` (settings.view): the last 20 changes. */
export const getSettingHistory = async (key: string): Promise<ApiResponse<SettingChange[]>> =>
  adminGet<SettingChange[]>(
    `/admin/settings/${encodeURIComponent(key)}/history`,
    { cache: "no-store" },
    "Couldn't load the history. Please try again.",
  );
