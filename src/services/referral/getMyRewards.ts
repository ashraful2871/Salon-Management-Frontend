import { TAGS } from "@/lib/cache-tags";
import { referralGet, toQuery, type ReferralListResponse } from "./request";
import type { ReferralReward, RewardStatus } from "./types";

/** `GET /referrals/me/rewards?status&page`: my rewards, usable ones first, 20 a page. */
export const getMyRewards = async (
  status?: RewardStatus,
  page = 1,
): Promise<ReferralListResponse<ReferralReward[]>> =>
  referralGet<ReferralReward[]>(
    `/referrals/me/rewards${toQuery({ status, page })}`,
    { next: { revalidate: 30, tags: [TAGS.myRewards] } },
    "Couldn't load your rewards. Please try again.",
  ) as Promise<ReferralListResponse<ReferralReward[]>>;
