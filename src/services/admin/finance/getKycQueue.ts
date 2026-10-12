import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminKycRow, KycStatus } from "./payoutAccountTypes";

/** `GET /admin/finance/kyc` (finance.payout_accounts): businesses by KYC status. */
export const getKycQueue = (params: {
  status?: KycStatus;
  page?: number;
}): Promise<ApiResponse<AdminKycRow[]>> =>
  adminGet<AdminKycRow[]>(
    `/admin/finance/kyc${toQuery(params)}`,
    { next: { revalidate: 30, tags: [TAGS.adminPayoutAccounts] } },
    "Couldn't load the KYC queue. Please try again.",
  );
