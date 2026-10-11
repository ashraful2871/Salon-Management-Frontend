"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";

/** `POST /ai/backfill` (system.operate): re-embed salons that are missing or stale. */
export const backfillAiIndex = async (): Promise<ApiResponse<unknown>> => {
  const result = await adminSend<unknown>(
    "post",
    "/ai/backfill",
    undefined,
    "Couldn't run the backfill. Please try again.",
  );
  if (result.success) updateTag(TAGS.adminSystem);
  return result;
};
