import { TAGS } from "@/lib/cache-tags";
import { referralGet, toQuery, type ReferralListResponse } from "./request";
import type { ReferralFriend } from "./types";

/** `GET /referrals/me/friends?page`: who joined with my code and how far each got, newest first, 20 a page. */
export const getMyFriends = async (page = 1): Promise<ReferralListResponse<ReferralFriend[]>> =>
  referralGet<ReferralFriend[]>(
    `/referrals/me/friends${toQuery({ page })}`,
    { next: { revalidate: 60, tags: [TAGS.myReferral] } },
    "Couldn't load your friends. Please try again.",
  ) as Promise<ReferralListResponse<ReferralFriend[]>>;
