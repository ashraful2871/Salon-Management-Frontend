import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { FinanceOverview } from "./types";

/** `GET /admin/finance/overview` (finance.view): earnings for a range + reconciliation counts. */
export const getFinanceOverview = (params: {
  from?: string;
  to?: string;
  includeTest?: boolean;
}): Promise<ApiResponse<FinanceOverview>> =>
  adminGet<FinanceOverview>(
    `/admin/finance/overview${toQuery(params)}`,
    { next: { revalidate: 30, tags: [TAGS.adminFinance] } },
    "Couldn't load the finance overview. Please try again.",
  );
