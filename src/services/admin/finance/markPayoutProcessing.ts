"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { AdminPayout } from "./types";

/** `POST /admin/finance/payouts/:id/processing` (finance.payouts, tier 2): the transfer is under way. */
export const markPayoutProcessing = async (
  id: string,
  method?: "BKASH" | "BANK",
): Promise<ApiResponse<AdminPayout>> => {
  const result = await adminSend<AdminPayout>(
    "post",
    `/admin/finance/payouts/${encodeURIComponent(id)}/processing`,
    { method },
    "Couldn't update the payout. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminPayouts);
    revalidateTag(TAGS.ownerPayouts, "max");
    revalidateTag(TAGS.ownerMoney, "max");
    revalidateTag(TAGS.adminFinance, "max");
  }
  return result;
};
