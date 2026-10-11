"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { PayoutPreview } from "./types";

/** `POST /admin/finance/payouts/preview` (finance.payouts): what a run would raise. No writes. */
export const previewPayoutBatch = async (
  periodEnd?: string,
): Promise<ApiResponse<PayoutPreview>> =>
  adminSend<PayoutPreview>(
    "post",
    "/admin/finance/payouts/preview",
    { periodEnd },
    "Couldn't build the payout preview. Please try again.",
  );
