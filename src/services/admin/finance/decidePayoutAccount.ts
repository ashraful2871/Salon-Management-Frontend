"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import type { PayoutAccount } from "@/services/owner/payoutAccountTypes";
import { adminSend } from "../request";

/**
 * `POST /admin/finance/payout-accounts/:id/verify|reject` (tier 3, step-up).
 * Verifying retires the business's previous account.
 */
export const decidePayoutAccount = async (
  id: string,
  decision: { verified: true } | { verified: false; reason: string },
): Promise<ApiResponse<PayoutAccount & { disabled: number }>> => {
  const result = await adminSend<PayoutAccount & { disabled: number }>(
    "post",
    `/admin/finance/payout-accounts/${encodeURIComponent(id)}/${decision.verified ? "verify" : "reject"}`,
    decision.verified ? undefined : { reason: decision.reason },
    "Couldn't update the account. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminPayoutAccounts);
    revalidateTag(TAGS.payoutAccounts, "max");
  }
  return result;
};
