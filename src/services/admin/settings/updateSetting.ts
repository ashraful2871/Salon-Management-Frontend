"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

export type SavedSetting = { key: string; value: unknown; version: number; updatedAt: string };

/**
 * `PATCH /admin/settings/:key`. Flags need flags.manage, content.* needs
 * content.manage (tier 2); everything else settings.manage (tier 3: step-up).
 */
export const updateSetting = async (
  key: string,
  value: unknown,
  reason: string,
): Promise<ApiResponse<SavedSetting>> => {
  const result = await adminSend<SavedSetting>(
    "patch",
    `/admin/settings/${encodeURIComponent(key)}`,
    { value, reason },
    "Couldn't save the setting. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminSettings);
    updateTag(TAGS.adminApprovals);
    revalidateTag(TAGS.publicSettings, "max");
  }
  return result;
};
