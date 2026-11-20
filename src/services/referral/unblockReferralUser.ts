"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminReferralAction } from "./admin-action";
import { enc } from "./request";

/** `POST /admin/referrals/users/:userId/unblock { reason? }` (referrals.manage, step-up): the code works again. */
export const unblockReferralUser = async (userId: string, reason?: string): Promise<ApiResponse<unknown>> =>
  adminReferralAction(
    `/users/${enc(userId)}/unblock`,
    { reason },
    "Couldn't unblock this person. Please try again.",
    userId,
  );
