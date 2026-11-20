import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { referralGet, toQuery } from "./request";
import type { AdminReferralFilters, AdminReferralOverview } from "./types";

/** `GET /admin/referrals/overview?from&to&includeTest` (referrals.view): Dhaka days, the last 30 by default. */
export const getReferralOverview = async (
  filters: AdminReferralFilters = {},
): Promise<ApiResponse<AdminReferralOverview>> =>
  referralGet<AdminReferralOverview>(
    `/admin/referrals/overview${toQuery(filters)}`,
    { next: { revalidate: 60, tags: [TAGS.adminReferrals] } },
    "Couldn't load the referral overview. Please try again.",
  );
