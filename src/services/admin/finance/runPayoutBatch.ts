"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { PayoutRunResult } from "./types";

/** `POST /settlements/payouts/run` (finance.payouts, step-up). */
export const runPayoutBatch = async (
  periodEnd: string | undefined,
  reason: string,
): Promise<ApiResponse<PayoutRunResult>> => {
  const result = await adminSend<PayoutRunResult>(
    "post",
    "/settlements/payouts/run",
    { periodEnd, reason },
    "Couldn't run the payout batch. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminPayouts);
    updateTag(TAGS.adminFinance);
    revalidateTag(TAGS.earnings, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
