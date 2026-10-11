"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/**
 * Approve (`PATCH .../approve`) or reject (`PATCH .../reject`, which needs a
 * `rejectionReason`) an owner application. Either way the applicant gets an
 * email and the audit log a row.
 */
export const decideApplication = async (
  id: string,
  decision: { approve: true } | { approve: false; rejectionReason: string },
): Promise<ApiResponse<unknown>> => {
  const path = `/become-salon-owner/applications/${encodeURIComponent(id)}/${decision.approve ? "approve" : "reject"}`;
  const result = await adminSend<unknown>(
    "patch",
    path,
    decision.approve ? {} : { rejectionReason: decision.rejectionReason },
    decision.approve
      ? "Couldn't approve the application. Please try again."
      : "Couldn't reject the application. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.salonApplications);
    updateTag(TAGS.adminInbox);
    revalidateTag(TAGS.applicationsStatus, "max");
    revalidateTag(TAGS.adminUsers, "max");
    revalidateTag(TAGS.users, "max");
  }
  return result;
};
