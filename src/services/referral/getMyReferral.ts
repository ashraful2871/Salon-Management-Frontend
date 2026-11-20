import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { deviceHeaders } from "@/lib/device-headers";
import { referralGet } from "./request";
import type { MyReferral } from "./types";

/**
 * `GET /referrals/me`: the Refer page (code made on the first visit, link,
 * terms, stats, share text). Sends the device id: the API remembers it as the
 * referrer's, for the SAME_DEVICE signal. CUSTOMER only (else `CUSTOMER_ONLY`).
 */
export const getMyReferral = async (): Promise<ApiResponse<MyReferral>> =>
  referralGet<MyReferral>(
    "/referrals/me",
    { next: { revalidate: 60, tags: [TAGS.myReferral] }, headers: await deviceHeaders() },
    "Couldn't load your invite code. Please try again.",
  );
