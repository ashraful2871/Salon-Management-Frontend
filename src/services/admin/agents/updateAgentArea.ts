"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `PATCH /admin/agents/:id`: re-scopes an agent (tier 2, reason required). */
export const updateAgentArea = async (
  id: string,
  input: { division: string; district: string; area: string; reason: string },
): Promise<ApiResponse<{ id: string }>> => {
  const result = await adminSend<{ id: string }>(
    "patch",
    `/admin/agents/${encodeURIComponent(id)}`,
    input,
    "Couldn't change the area. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminAgents);
    updateTag(TAGS.adminUser(id));
  }
  return result;
};
