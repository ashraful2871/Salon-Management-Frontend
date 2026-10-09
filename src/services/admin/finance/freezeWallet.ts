"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { WalletCard } from "./types";

/** `PATCH /admin/finance/wallets/:userId/freeze` (finance.wallet_freeze, step-up). */
export const freezeWallet = async (
  userId: string,
  frozen: boolean,
  reason: string,
): Promise<ApiResponse<WalletCard>> => {
  const result = await adminSend<WalletCard>(
    "patch",
    `/admin/finance/wallets/${encodeURIComponent(userId)}/freeze`,
    { frozen, reason },
    "Couldn't change the wallet. Please try again.",
  );
  if (result.success) updateTag(TAGS.adminWallets);
  return result;
};
