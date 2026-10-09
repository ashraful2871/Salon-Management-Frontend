"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/**
 * `POST /admin/approvals/:id/approve` (step-up; runs the money move) or
 * `/reject` (a note is required). Either way every money view may have moved.
 */
export const decideApproval = async (
  id: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<ApiResponse<{ id: string; status: string }>> => {
  const result = await adminSend<{ id: string; status: string }>(
    "post",
    `/admin/approvals/${encodeURIComponent(id)}/${decision}`,
    { note: note?.trim() || undefined },
    decision === "approve"
      ? "Couldn't approve the request. Please try again."
      : "Couldn't reject the request. Please try again.",
  );
  // A failed execution still changes the request's status.
  updateTag(TAGS.adminApprovals);
  revalidateTag(TAGS.adminInbox, "max");
  revalidateTag(TAGS.adminMe, "max");
  if (decision === "approve") {
    updateTag(TAGS.adminWallets);
    updateTag(TAGS.adminPayouts);
    revalidateTag(TAGS.adminFinance, "max");
    revalidateTag(TAGS.adminTopups, "max");
    revalidateTag(TAGS.adminSettings, "max");
    revalidateTag(TAGS.publicSettings, "max");
    revalidateTag(TAGS.earnings, "max");
  }
  return result;
};
