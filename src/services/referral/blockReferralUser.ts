"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminReferralAction } from "./admin-action";
import { enc } from "./request";

/** `POST /admin/referrals/users/:userId/block { reason }` (referrals.manage, step-up): the code stops working, held rewards are revoked. */
export const blockReferralUser = async (userId: string, reason: string): Promise<ApiResponse<unknown>> =>
  adminReferralAction(
    `/users/${enc(userId)}/block`,
    { reason },
    "Couldn't block this person from referrals. Please try again.",
    userId,
  );
