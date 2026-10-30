import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { policyFromSettings, type HomePolicyWithText } from "@/lib/home-policy";
import type { AdminSetting, AdminSettings } from "@/services/admin/settings/types";
import { homeGet } from "./request";

export type HomePolicyPage = {
  /** Every `homeService.*` setting row (value, bounds, approval, version, who saved it). */
  settings: AdminSetting[];
  /** The policy in force, as the quote would snapshot it. */
  policy: HomePolicyWithText;
};

/**
 * The Fees & policy page's data: the `homeService` group of `GET
 * /admin/settings`. Saves go through the shared `updateSetting` (step-up,
 * four-eyes on the money keys).
 */
export const getHomePolicy = async (): Promise<ApiResponse<HomePolicyPage>> => {
  const result = await homeGet<AdminSettings>(
    "/admin/settings",
    { next: { revalidate: 30, tags: [TAGS.adminSettings] } },
    "Couldn't load the Home Service policy. Please try again.",
  );
  if (!result.success || !result.data) return { success: false, message: result.message, errorCode: result.errorCode };
  const settings = result.data.groups.find((g) => g.group === "homeService")?.settings ?? [];
  return { success: true, message: result.message, data: { settings, policy: policyFromSettings(settings) } };
};
