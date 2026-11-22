"use server";

import { getRewardSummary } from "./getRewardSummary";
import type { RewardScope } from "./types";

/**
 * The signed-in customer's best usable reward as `{ percent, scope }`, for the
 * "5% reward applied at checkout" teaser in client components (the chat's home
 * summary). Null when there is none, redemptions are off or the call fails.
 * Never an amount: the server prices the reward at review.
 */
export const getRewardTeaser = async (): Promise<{ percent: number; scope: RewardScope } | null> => {
  const res = await getRewardSummary();
  const best = res.success && res.data?.redemptionsOn ? res.data.best : null;
  return best ? { percent: best.percent, scope: best.scope } : null;
};
