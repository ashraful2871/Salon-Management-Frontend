"use server";

import type { ApiResponse } from "@/lib/api-types";
import type { SettingChange } from "@/services/admin/settings/types";
import { enc, homeGet } from "./request";

/** `GET /admin/home-service/policy/:key/history` (homeservice.view): the last 20 changes of a home setting. */
export const getHomePolicyHistory = async (key: string): Promise<ApiResponse<SettingChange[]>> =>
  homeGet<SettingChange[]>(
    `/admin/home-service/policy/${enc(key)}/history`,
    { cache: "no-store" },
    "Couldn't load the history. Please try again.",
  );
