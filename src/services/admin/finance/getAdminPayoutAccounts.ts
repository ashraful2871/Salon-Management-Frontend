import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminPayoutAccounts, PayoutAccountStatus } from "./payoutAccountTypes";

/** `GET /admin/finance/payout-accounts` (finance.payout_accounts): masked numbers. */
export const getAdminPayoutAccounts = (params: {
  status: PayoutAccountStatus;
  page?: number;
}): Promise<ApiResponse<AdminPayoutAccounts>> =>
  adminGet<AdminPayoutAccounts>(
    `/admin/finance/payout-accounts${toQuery(params)}`,
    { next: { revalidate: 30, tags: [TAGS.adminPayoutAccounts] } },
    "Couldn't load the payout accounts. Please try again.",
  );
