"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";

/**
 * `GET /admin/finance/payout-accounts/:id/reveal` (finance.payout_accounts +
 * users.view_pii). The full number, never cached; every call is audited.
 */
export const revealPayoutAccount = async (
  id: string,
): Promise<ApiResponse<{ id: string; number: string | null }>> =>
  adminGet<{ id: string; number: string | null }>(
    `/admin/finance/payout-accounts/${encodeURIComponent(id)}/reveal`,
    { cache: "no-store" },
    "Couldn't show the account number. Please try again.",
  );
