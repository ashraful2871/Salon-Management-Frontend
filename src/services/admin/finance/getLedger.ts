"use server";

import type { ApiResponse } from "@/lib/api-types";
import { adminGet, toQuery } from "../request";
import type { LedgerPage } from "./types";

/**
 * `GET /admin/finance/ledger` (finance.view): 50 entries a page, newest first;
 * pass the last `nextCursor` for the next. A Server Action, so "Load more" can
 * call it from the client.
 */
export const getLedger = async (params: {
  account?: string;
  salonId?: string;
  appointmentId?: string;
  payoutId?: string;
  from?: string;
  to?: string;
  cursor?: string;
}): Promise<ApiResponse<LedgerPage>> =>
  adminGet<LedgerPage>(
    `/admin/finance/ledger${toQuery(params)}`,
    { cache: "no-store" },
    "Couldn't load the ledger. Please try again.",
  );
