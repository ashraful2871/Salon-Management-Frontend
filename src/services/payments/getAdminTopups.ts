import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { TopupIntentStatus } from "@/services/wallet/checkTopupStatus";

/** One entry of a top-up's refund history, as `GET /payments/admin/intents` sends it. */
export type AdminTopupRefund = {
  n: number;
  amountMinor: number;
  refundRef: string | null;
  status: "COMPLETED" | "UNKNOWN" | "FAILED";
  at: string | null;
  message: string | null;
};

export type AdminTopup = {
  id: string;
  transactionId: string;
  provider: string;
  amountMinor: number;
  status: TopupIntentStatus;
  gatewayRef: string | null;
  failureReason: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: { id: string; name: string | null; email: string };
  /** What the customer can spend now: a refund above this is refused. */
  availableMinor: number;
  refundedMinor: number;
  remainingMinor: number;
  refunds: AdminTopupRefund[];
  hasUnknownRefund: boolean;
};

export type AdminTopupFilters = {
  page?: number;
  limit?: number;
  /** An intent status, or "ALL". The API defaults to SUCCESS. */
  status?: string;
  provider?: string;
  searchTerm?: string;
};

export const getAdminTopups = async (
  query?: AdminTopupFilters,
): Promise<ApiResponse<AdminTopup[]>> => {
  try {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.status) params.set("status", query.status);
    if (query?.provider) params.set("provider", query.provider);
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);

    const url = `/payments/admin/intents${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await serverFetch.get(url, {
      next: {
        revalidate: 30,
        tags: ["admin-topups"],
      },
    });

    const result: ApiResponse<AdminTopup[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getAdminTopups error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load top-ups.",
    };
  }
};
