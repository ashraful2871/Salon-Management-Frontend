"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

export type ReconcileResult = Record<string, number>;

/** `POST /payments/admin/reconcile` (finance.reconcile): settle stuck gateway intents now. */
export const runReconciliation = async (): Promise<ApiResponse<ReconcileResult>> => {
  const result = await adminSend<ReconcileResult>(
    "post",
    "/payments/admin/reconcile",
    {},
    "Couldn't run reconciliation. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminFinance);
    revalidateTag(TAGS.adminTopups, "max");
    revalidateTag(TAGS.adminInbox, "max");
  }
  return result;
};
