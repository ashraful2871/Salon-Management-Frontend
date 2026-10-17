"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { MarkPaidItem, PayoutItemResult } from "./types";

/**
 * `POST /admin/finance/payouts/mark-paid` (finance.payouts, step-up), up to
 * 200 items, each its own move with its own result: a reused reference, a
 * payout that still needs a second admin's approval, or one already paid comes
 * back `ok: false` and the rest go through.
 */
export const markPayoutsPaid = async (
  items: MarkPaidItem[],
): Promise<ApiResponse<PayoutItemResult[]>> => {
  const result = await adminSend<PayoutItemResult[]>(
    "post",
    "/admin/finance/payouts/mark-paid",
    { items },
    "Couldn't mark the payouts paid. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminPayouts);
    revalidateTag(TAGS.adminFinance, "max");
    revalidateTag(TAGS.earnings, "max");
    // PAID writes the owner's payout statement.
    revalidateTag(TAGS.ownerStatements, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
