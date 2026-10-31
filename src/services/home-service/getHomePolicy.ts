import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { policyFromSettings, type HomePolicyWithText } from "@/lib/home-policy";
import type { AdminSetting } from "@/services/admin/settings/types";
import { homeGet } from "./request";

export type HomePolicyPage = {
  /** Every `homeService.*` setting row, switches included (value, bounds, approval, version, who saved it). */
  settings: AdminSetting[];
  /** The policy in force, as the quote would snapshot it. */
  policy: HomePolicyWithText;
};

/**
 * The Fees & policy page's data: `GET /admin/home-service/policy`
 * (homeservice.view, so SUPPORT can read it without settings.view). Saves go
 * through the shared `updateSetting` (step-up, four-eyes on the money keys).
 */
export const getHomePolicy = async (): Promise<ApiResponse<HomePolicyPage>> => {
  const result = await homeGet<Pick<HomePolicyPage, "settings">>(
    "/admin/home-service/policy",
    { next: { revalidate: 30, tags: [TAGS.adminSettings] } },
    "Couldn't load the Home Service policy. Please try again.",
  );
  if (!result.success || !result.data) return { success: false, message: result.message, errorCode: result.errorCode };
  const { settings } = result.data;
  return { success: true, message: result.message, data: { settings, policy: policyFromSettings(settings) } };
};
