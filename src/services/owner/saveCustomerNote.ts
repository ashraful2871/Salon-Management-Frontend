"use server";

import { updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { CustomerNote } from "./customer-types";

/** `PUT /owner/customers/:id/note`: the business's private note and tags. */
export const saveCustomerNote = async (
  customerId: string,
  input: { note?: string | null; tags?: string[] },
): Promise<ApiResponse<CustomerNote>> => {
  try {
    const response = await serverFetch.put(`/owner/customers/${encodeURIComponent(customerId)}/note`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    const result = (await response.json()) as ApiResponse<CustomerNote>;
    if (result.success) updateTag(TAGS.ownerCustomers);
    return result;
  } catch (error) {
    console.error("saveCustomerNote error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't save the note. Please try again.",
    };
  }
};
