"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../admin/request";

export type RecheckTopupResult = {
  id: string;
  transactionId: string;
  status: string;
  previousStatus: string;
  failureReason: string | null;
};

/**
 * `POST /payments/admin/intents/:id/check` (finance.reconcile): asks the
 * gateway about one pending top-up now. Credited if it settled, closed if it
 * failed or was abandoned over 24 h ago, left alone if still in flight.
 */
export const recheckTopup = async (
  intentId: string,
): Promise<ApiResponse<RecheckTopupResult>> => {
  const result = await adminSend<RecheckTopupResult>(
    "post",
    `/payments/admin/intents/${encodeURIComponent(intentId)}/check`,
    {},
    "Couldn't check this top-up. Please try again.",
  );
  if (result.success && result.data?.status !== result.data?.previousStatus) {
    updateTag(TAGS.adminTopups);
    revalidateTag(TAGS.adminInbox, "max");
    revalidateTag(TAGS.adminFinance, "max");
    revalidateTag(TAGS.earnings, "max");
  }
  return result;
};
