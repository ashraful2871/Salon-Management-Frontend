"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminReferralAction } from "./admin-action";
import { enc } from "./request";

/** `POST /admin/referrals/:id/approve { reason? }` (referrals.manage, step-up): the held referrer reward becomes AVAILABLE. */
export const approveReferral = async (id: string, reason?: string): Promise<ApiResponse<unknown>> =>
  adminReferralAction(`/${enc(id)}/approve`, { reason }, "Couldn't approve this referral. Please try again.");
