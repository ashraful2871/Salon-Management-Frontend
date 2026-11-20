"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminReferralAction } from "./admin-action";
import type { AdminRewardView, GrantRewardInput } from "./types";

/** `POST /admin/referrals/rewards/grant` (referrals.manage, step-up): a MANUAL_GRANT reward for an ACTIVE customer. */
export const grantReward = async (input: GrantRewardInput): Promise<ApiResponse<AdminRewardView>> =>
  adminReferralAction<AdminRewardView>(
    "/rewards/grant",
    input,
    "Couldn't grant this reward. Please try again.",
    input.userId,
  );
