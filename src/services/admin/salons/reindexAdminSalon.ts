"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `POST /admin/salons/:id/reindex`: re-embeds the salon for AI search now. */
export const reindexAdminSalon = async (id: string): Promise<ApiResponse<{ outcome: string }>> => {
  const result = await adminSend<{ outcome: string }>(
    "post",
    `/admin/salons/${encodeURIComponent(id)}/reindex`,
    undefined,
    "Couldn't re-index this salon. Please try again.",
  );
  if (result.success) updateTag(TAGS.adminSalon(id));
  return result;
};
