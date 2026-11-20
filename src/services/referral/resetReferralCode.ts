"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminReferralAction } from "./admin-action";
import { enc } from "./request";

/** `POST /admin/referrals/users/:userId/code/reset { reason? }` (referrals.manage, step-up): a new code; the old one stops working. */
export const resetReferralCode = async (userId: string, reason?: string): Promise<ApiResponse<unknown>> =>
  adminReferralAction(
    `/users/${enc(userId)}/code/reset`,
    { reason },
    "Couldn't reset this code. Please try again.",
    userId,
  );
