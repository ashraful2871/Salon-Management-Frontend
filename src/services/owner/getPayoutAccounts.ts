import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { PayoutSettings } from "./payoutAccountTypes";

/** `GET /owner/payout-accounts`: the business's payout accounts (masked) and KYC. */
export const getPayoutAccounts = async (): Promise<ApiResponse<PayoutSettings>> => {
  try {
    const response = await serverFetch.get("/owner/payout-accounts", {
      next: { revalidate: 60, tags: [TAGS.payoutAccounts] },
    });
    return (await response.json()) as ApiResponse<PayoutSettings>;
  } catch (error) {
    console.error("getPayoutAccounts error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your payout settings.",
    };
  }
};
