import type { ApiResponse } from "@/lib/api-types";
import { isApprovalRequired } from "@/services/admin/finance/types";
import type { AdminSetting } from "@/services/admin/settings/types";
import { updateSetting, type SavedSetting } from "@/services/admin/settings/updateSetting";

export type SettingEdit = { setting: AdminSetting; value: unknown };

/**
 * Saves `edits` one by one under one reason. Tier 3 goes first, so a step-up
 * prompt comes before anything is written (run it through `useStepUp`, or
 * `ReasonDialog`'s `stepUp`). A key under four-eyes answers `APPROVAL_REQUIRED`
 * and is queued, one request per key: there is no batch endpoint.
 */
export const saveSettings = async (edits: SettingEdit[], reason: string): Promise<ApiResponse<SavedSetting>> => {
  const ordered = [...edits].sort((a, b) => b.setting.tier - a.setting.tier);
  let last: ApiResponse<SavedSetting> = { success: false, message: "Nothing to save" };
  let queued = 0;
  for (const [i, { setting, value }] of ordered.entries()) {
    last = await updateSetting(setting.key, value, reason);
    if (!last.success) {
      return i === 0 ? last : { ...last, message: `Saved ${i} of ${ordered.length}. ${last.message}` };
    }
    if (isApprovalRequired(last.data)) queued += 1;
  }
  const saved = ordered.length - queued;
  return {
    ...last,
    message:
      queued === 0
        ? ordered.length === 1
          ? `${ordered[0].setting.label} saved`
          : `${ordered.length} settings saved`
        : saved === 0
          ? queued === 1
            ? "Sent for approval. Waiting for a second admin."
            : `${queued} changes sent for approval. Waiting for a second admin.`
          : `${saved} saved, ${queued} sent for approval. Waiting for a second admin.`,
  };
};
