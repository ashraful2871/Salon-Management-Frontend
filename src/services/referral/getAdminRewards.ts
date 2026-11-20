import { TAGS } from "@/lib/cache-tags";
import { referralGet, toQuery, type AdminReferralListResponse } from "./request";
import type { AdminRewardQuery, AdminRewardRow } from "./types";

/** `GET /admin/referrals/rewards` (referrals.view): every reward, newest first, 20 a page. */
export const getAdminRewards = async (
  q: AdminRewardQuery = {},
): Promise<AdminReferralListResponse<AdminRewardRow[]>> =>
  referralGet<AdminRewardRow[]>(
    `/admin/referrals/rewards${toQuery(q)}`,
    { next: { revalidate: 30, tags: [TAGS.adminReferrals] } },
    "Couldn't load the rewards. Please try again.",
  ) as Promise<AdminReferralListResponse<AdminRewardRow[]>>;
