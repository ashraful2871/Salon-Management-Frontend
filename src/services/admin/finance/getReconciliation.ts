import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminGet } from "../request";
import type { Reconciliation } from "./types";

/** `GET /admin/finance/reconciliation` (finance.view): unbalanced bookings and wallet drift. */
export const getReconciliation = (): Promise<ApiResponse<Reconciliation>> =>
  adminGet<Reconciliation>(
    "/admin/finance/reconciliation",
    { next: { revalidate: 30, tags: [TAGS.adminFinance] } },
    "Couldn't load the reconciliation report. Please try again.",
  );
