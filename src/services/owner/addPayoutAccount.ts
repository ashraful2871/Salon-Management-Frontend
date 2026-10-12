"use server";

import { updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import type { AddPayoutAccountInput, PayoutAccount } from "./payoutAccountTypes";

/** `POST /owner/payout-accounts`: adds an account for Finance to verify. */
export const addPayoutAccount = async (
  input: AddPayoutAccountInput,
): Promise<ApiResponse<PayoutAccount>> => {
  try {
    const response = await serverFetch.post("/owner/payout-accounts", {
      headers: { "Content-Type": "application/json", ...(await clientIpHeaders()) },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<PayoutAccount>;
    if (result.success) {
      updateTag(TAGS.payoutAccounts);
      updateTag(TAGS.adminPayoutAccounts);
    }
    return result;
  } catch (error) {
    console.error("addPayoutAccount error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't add the account. Please try again.",
    };
  }
};
