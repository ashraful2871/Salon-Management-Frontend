import { TAGS } from "@/lib/cache-tags";
import { referralGet, toQuery, type AdminReferralListResponse } from "./request";
import type { AdminReferralQuery, AdminReferralRow } from "./types";

/** `GET /admin/referrals` (referrals.view): every referral, newest first, 20 a page. */
export const getAdminReferrals = async (
  q: AdminReferralQuery = {},
): Promise<AdminReferralListResponse<AdminReferralRow[]>> =>
  referralGet<AdminReferralRow[]>(
    `/admin/referrals${toQuery(q)}`,
    { next: { revalidate: 30, tags: [TAGS.adminReferrals] } },
    "Couldn't load the referrals. Please try again.",
  ) as Promise<AdminReferralListResponse<AdminReferralRow[]>>;
