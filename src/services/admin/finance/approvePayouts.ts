"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { PayoutItemResult } from "./types";

/**
 * `POST /admin/finance/payouts/approve` (finance.payouts, step-up), up to 200
 * ids. Each payout is its own move: one over `approvals.payoutOverMinor` comes
 * back `APPROVAL_REQUIRED` (a second admin approves the request), one that
 * cannot move comes back `ok: false` with the reason.
 */
export const approvePayouts = async (
  ids: string[],
  reason?: string,
): Promise<ApiResponse<PayoutItemResult[]>> => {
  const result = await adminSend<PayoutItemResult[]>(
    "post",
    "/admin/finance/payouts/approve",
    { ids, reason },
    "Couldn't approve the payouts. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminPayouts);
    revalidateTag(TAGS.ownerPayouts, "max");
    revalidateTag(TAGS.ownerMoney, "max");
    updateTag(TAGS.adminApprovals);
    revalidateTag(TAGS.adminFinance, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
