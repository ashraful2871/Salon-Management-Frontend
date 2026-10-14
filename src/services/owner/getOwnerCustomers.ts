"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { customersQuery, type CustomerFilters, type CustomerPage } from "./customer-types";

/**
 * `GET /owner/customers`: everyone who booked at a branch in scope, last
 * booking first, with segment counts on the first page. A server action as
 * well, so "Load more" can ask for the next cursor.
 */
export const getOwnerCustomers = async (
  filters: CustomerFilters,
  cursor?: string,
): Promise<ApiResponse<CustomerPage>> => {
  try {
    const query = customersQuery(filters, cursor);
    const response = await serverFetch.get(`/owner/customers?limit=25&${query}`, {
      next: { revalidate: 60, tags: [TAGS.ownerCustomers] },
    });
    return (await response.json()) as ApiResponse<CustomerPage>;
  } catch (error) {
    console.error("getOwnerCustomers error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your customers.",
    };
  }
};
