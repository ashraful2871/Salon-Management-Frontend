"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { AdminPayout, ApprovalRequired, PayoutStatus } from "./types";

/**
 * `PATCH /settlements/payouts/:id` (finance.payouts, step-up). PAID needs a
 * reference and a method; with four-eyes on it answers APPROVAL_REQUIRED.
 */
export const updatePayout = async (
  id: string,
  body: {
    status: PayoutStatus;
    method?: "BKASH" | "BANK";
    reference?: string;
    proofUrl?: string;
    failureReason?: string;
    reason?: string;
  },
): Promise<ApiResponse<AdminPayout | ApprovalRequired>> => {
  const result = await adminSend<AdminPayout | ApprovalRequired>(
    "patch",
    `/settlements/payouts/${encodeURIComponent(id)}`,
    body,
    "Couldn't update the payout. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminPayouts);
    updateTag(TAGS.adminApprovals);
    revalidateTag(TAGS.adminFinance, "max");
    revalidateTag(TAGS.earnings, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
