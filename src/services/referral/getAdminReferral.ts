import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, referralGet } from "./request";
import type { AdminReferralDetail } from "./types";

/** `GET /admin/referrals/:id` (referrals.view): both people, flags, rewards, bookings and the timeline. */
export const getAdminReferral = async (id: string): Promise<ApiResponse<AdminReferralDetail>> =>
  referralGet<AdminReferralDetail>(
    `/admin/referrals/${enc(id)}`,
    { next: { revalidate: 30, tags: [TAGS.adminReferrals] } },
    "Couldn't load this referral. Please try again.",
  );
