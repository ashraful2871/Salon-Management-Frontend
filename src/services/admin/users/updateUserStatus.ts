"use server";

import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { UserStatusInput, UserStatusResult } from "./types";

/** `PATCH /admin/users/:id/status`: suspend, block or reactivate, with a reason (tier 2). */
export const updateUserStatus = async (
  id: string,
  input: UserStatusInput,
): Promise<ApiResponse<UserStatusResult>> => {
  const result = await adminSend<UserStatusResult>(
    "patch",
    `/admin/users/${encodeURIComponent(id)}/status`,
    input,
    "Couldn't change the account status. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminUsers);
    updateTag(TAGS.adminUser(id));
    revalidateTag(TAGS.adminAgents, "max");
    if (input.cancelUpcoming) revalidateTag(TAGS.appointments, "max");
    if (input.suspendSalons) revalidateTag(TAGS.salons, "max");
  }
  return result;
};
