import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { referralSend } from "./request";

/**
 * A back-office write under `/admin/referrals/*` (tier 3: answers
 * `STEP_UP_REQUIRED` without a fresh code, so the caller's `useStepUp()` can
 * retry once), from inside a server action. The result is returned as the API
 * sent it, `errorCode` included. On success the referral views and the inbox
 * (`referrals.review`) are on screen; the user's 360 card follows.
 */
export const adminReferralAction = async <T>(
  path: string,
  body: unknown,
  fallback: string,
  userId?: string,
): Promise<ApiResponse<T>> => {
  const result = await referralSend<T>("post", `/admin/referrals${path}`, body ?? {}, fallback);
  if (result.success) {
    updateTag(TAGS.adminReferrals);
    updateTag(TAGS.adminInbox);
    if (userId) revalidateTag(TAGS.adminUser(userId), "max");
  }
  return result;
};
