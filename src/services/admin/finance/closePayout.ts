"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { AdminPayout } from "./types";

/**
 * `POST /admin/finance/payouts/:id/cancel|fail { reason }` (finance.payouts,
 * step-up). Cancel is for PENDING/APPROVED, fail for PROCESSING; both put the
 * money back in the business's balance, and a failure emails the owner.
 */
export const closePayout = async (
  id: string,
  action: "cancel" | "fail",
  reason: string,
): Promise<ApiResponse<AdminPayout>> => {
  const result = await adminSend<AdminPayout>(
    "post",
    `/admin/finance/payouts/${encodeURIComponent(id)}/${action}`,
    { reason },
    "Couldn't update the payout. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminPayouts);
    revalidateTag(TAGS.adminFinance, "max");
    revalidateTag(TAGS.earnings, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
