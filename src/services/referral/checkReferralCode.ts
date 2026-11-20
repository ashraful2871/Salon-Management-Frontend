"use server";

import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { normalizeCode } from "@/lib/referral";
import { enc, referralGet } from "./request";
import type { InviteLookup } from "./types";

/**
 * The register form's live check of a typed code (`GET /referrals/code/:code`,
 * no-store). A string that can't be a code by its shape is refused here,
 * without a call, the way the API would refuse it.
 */
export const checkReferralCode = async (code: string): Promise<ApiResponse<InviteLookup>> => {
  const key = normalizeCode(code);
  if (!key) {
    return {
      success: false,
      message: "That invite code isn't valid. Check it, or remove it to continue.",
      errorCode: "REFERRAL_CODE_INVALID",
    };
  }
  return referralGet<InviteLookup>(
    `/referrals/code/${enc(key)}`,
    { cache: "no-store", headers: await clientIpHeaders() },
    "Couldn't check this code. Please try again.",
  );
};
