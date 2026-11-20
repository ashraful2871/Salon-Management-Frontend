import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { referralGet } from "./request";
import type { RewardSummary } from "./types";

/** `GET /referrals/me/rewards/summary`: how many usable rewards and the best one, for the booking teaser. */
export const getRewardSummary = async (): Promise<ApiResponse<RewardSummary>> =>
  referralGet<RewardSummary>(
    "/referrals/me/rewards/summary",
    { next: { revalidate: 30, tags: [TAGS.myRewards] } },
    "Couldn't load your rewards. Please try again.",
  );
