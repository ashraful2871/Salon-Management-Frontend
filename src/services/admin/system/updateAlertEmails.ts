"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `PATCH /admin/me { alertEmails }`: the caller's own alert emails. */
export const updateAlertEmails = async (
  alertEmails: boolean,
): Promise<ApiResponse<{ alertEmails: boolean }>> => {
  const result = await adminSend<{ alertEmails: boolean }>(
    "patch",
    "/admin/me",
    { alertEmails },
    "Couldn't save your alert preference.",
  );
  if (result.success) updateTag(TAGS.adminMe);
  return result;
};
