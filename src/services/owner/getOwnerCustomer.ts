import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { CustomerDetail } from "./customer-types";

/**
 * `GET /owner/customers/:id`: profile, stats, timeline, their reviews and the
 * business's note. 404 unless the customer booked at a branch in scope.
 */
export const getOwnerCustomer = async (
  customerId: string,
  salonId?: string,
): Promise<ApiResponse<CustomerDetail>> => {
  try {
    const query = salonId ? `?salonId=${encodeURIComponent(salonId)}` : "";
    const response = await serverFetch.get(`/owner/customers/${encodeURIComponent(customerId)}${query}`, {
      next: { revalidate: 60, tags: [TAGS.ownerCustomers] },
    });
    return (await response.json()) as ApiResponse<CustomerDetail>;
  } catch (error) {
    console.error("getOwnerCustomer error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load this customer.",
    };
  }
};
