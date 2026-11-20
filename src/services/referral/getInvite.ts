import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { normalizeCode } from "@/lib/referral";
import { enc, referralGet } from "./request";
import type { InviteLookup } from "./types";

/**
 * `GET /referrals/code/:code`, for the invite landing (server). Through
 * `serverFetch`, so a signed-in visitor reads `signedIn: true`; the client IP
 * goes along for the lookup limiter (contract 4). A valid and an invalid code
 * answer the same shape.
 */
export const getInvite = async (code: string): Promise<ApiResponse<InviteLookup>> => {
  const key = normalizeCode(code) ?? code.trim().toUpperCase().slice(0, 32);
  return referralGet<InviteLookup>(
    `/referrals/code/${enc(key)}`,
    { next: { revalidate: 60, tags: [TAGS.referralCode(key)] }, headers: await clientIpHeaders() },
    "Couldn't check this invite. Please try again.",
  );
};
