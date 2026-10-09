"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { ApprovalRequired, WalletTransaction } from "./types";

/**
 * `POST /wallet/admin/adjust` (finance.wallet_adjust, step-up). `amount` is
 * signed taka. `idempotencyKey` is a uuid made when the dialog opens, so the
 * retry after step-up (or a double click) lands once.
 */
export const adjustWallet = async (body: {
  userId: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
}): Promise<ApiResponse<WalletTransaction | ApprovalRequired>> => {
  const result = await adminSend<WalletTransaction | ApprovalRequired>(
    "post",
    "/wallet/admin/adjust",
    body,
    "Couldn't adjust the wallet. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminWallets);
    updateTag(TAGS.adminApprovals);
    revalidateTag(TAGS.adminFinance, "max");
  }
  return result;
};
