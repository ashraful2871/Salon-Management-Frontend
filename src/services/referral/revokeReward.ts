"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminReferralAction } from "./admin-action";
import { enc } from "./request";
import type { AdminRewardView } from "./types";

/** `POST /admin/referrals/rewards/:id/revoke { reason }` (referrals.manage, step-up): AVAILABLE / PENDING_REVIEW only. */
export const revokeReward = async (id: string, reason: string): Promise<ApiResponse<AdminRewardView>> =>
  adminReferralAction<AdminRewardView>(
    `/rewards/${enc(id)}/revoke`,
    { reason },
    "Couldn't revoke this reward. Please try again.",
  );
