"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminReferralAction } from "./admin-action";
import { enc } from "./request";

/** `POST /admin/referrals/:id/reject { reason }` (referrals.manage, step-up): a held referrer reward is revoked. */
export const rejectReferral = async (id: string, reason: string): Promise<ApiResponse<unknown>> =>
  adminReferralAction(`/${enc(id)}/reject`, { reason }, "Couldn't reject this referral. Please try again.");
