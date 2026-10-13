"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, adminSend } from "../request";
import type { ApprovalRequired } from "./types";

export type OwnerDuesRow = {
  ownerId: string;
  ownerName: string;
  email: string;
  businessName: string | null;
  duesMinor: number;
  since: string | null;
  ageDays: number | null;
  warnedAt: string | null;
  paused: boolean;
  pausedSalons: number;
  pausedAt: string | null;
};

/** `GET /admin/finance/dues` (finance.view): every business with dues or a DUES pause. */
export const getOwnerDues = async (includeTest = false): Promise<ApiResponse<OwnerDuesRow[]>> =>
  adminGet<OwnerDuesRow[]>(
    `/admin/finance/dues${includeTest ? "?includeTest=true" : ""}`,
    { next: { revalidate: 30, tags: [TAGS.adminDues, TAGS.adminFinance] } },
    "Couldn't load owner dues.",
  );

/**
 * `POST /admin/finance/dues/:ownerId/adjust` (finance.wallet_adjust, step-up,
 * four-eyes over `approvals.duesAdjustOverMinor`): waives part or all of the dues.
 */
export const adjustOwnerDues = async (
  ownerId: string,
  body: { amountMinor: number; reason: string },
): Promise<ApiResponse<{ duesAfterMinor?: number } | ApprovalRequired>> => {
  const result = await adminSend<{ duesAfterMinor?: number } | ApprovalRequired>(
    "post",
    `/admin/finance/dues/${encodeURIComponent(ownerId)}/adjust`,
    body,
    "Couldn't adjust the dues. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminDues);
    updateTag(TAGS.adminApprovals);
    revalidateTag(TAGS.adminFinance, "max");
    revalidateTag(TAGS.adminLedger, "max");
    revalidateTag(TAGS.ownerMoney, "max");
  }
  return result;
};
