"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { AdminPayoutOwner } from "./payoutAccountTypes";

/** `POST /admin/finance/kyc/:ownerId/verify|reject` (tier 3, step-up). */
export const decideKyc = async (
  ownerId: string,
  decision: { verified: true } | { verified: false; reason: string },
): Promise<ApiResponse<AdminPayoutOwner>> => {
  const result = await adminSend<AdminPayoutOwner>(
    "post",
    `/admin/finance/kyc/${encodeURIComponent(ownerId)}/${decision.verified ? "verify" : "reject"}`,
    decision.verified ? undefined : { reason: decision.reason },
    "Couldn't update the business details. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminPayoutAccounts);
    revalidateTag(TAGS.payoutAccounts, "max");
  }
  return result;
};
