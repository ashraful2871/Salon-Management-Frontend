import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { AdminPayouts, PayoutStatus } from "./types";

/** `GET /admin/finance/payouts` (finance.view): one status tab, with every tab's count. */
export const getPayouts = (params: {
  status: PayoutStatus;
  page?: number;
  includeTest?: boolean;
}): Promise<ApiResponse<AdminPayouts>> =>
  adminGet<AdminPayouts>(
    `/admin/finance/payouts${toQuery(params)}`,
    { next: { revalidate: 30, tags: [TAGS.adminPayouts] } },
    "Couldn't load the payouts. Please try again.",
  );
