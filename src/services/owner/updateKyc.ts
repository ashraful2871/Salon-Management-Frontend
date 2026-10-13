"use server";

import { updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { KycInput, OwnerKyc } from "./payoutAccountTypes";

/** `PATCH /owner/kyc`: business details, sent to Finance for verification. */
export const updateKyc = async (input: KycInput): Promise<ApiResponse<OwnerKyc>> => {
  try {
    const response = await serverFetch.patch("/owner/kyc", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<OwnerKyc>;
    if (result.success) {
      updateTag(TAGS.payoutAccounts);
      updateTag(TAGS.adminPayoutAccounts);
    }
    return result;
  } catch (error) {
    console.error("updateKyc error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't save your business details. Please try again.",
    };
  }
};
