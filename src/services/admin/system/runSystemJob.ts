"use server";

import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { adminSend } from "../request";
import type { JobRunOutcome } from "./types";

/**
 * `POST /admin/system/jobs/:name/run` (system.operate, step-up). Only jobs
 * marked safeToRunNow; answers within ~20 s with the outcome or "RUNNING".
 */
export const runSystemJob = async (name: string): Promise<ApiResponse<JobRunOutcome>> => {
  const result = await adminSend<JobRunOutcome>(
    "post",
    `/admin/system/jobs/${encodeURIComponent(name)}/run`,
    undefined,
    "Couldn't start the job. Please try again.",
  );
  if (result.success) {
    updateTag(TAGS.adminSystem);
    updateTag(TAGS.adminInbox);
  }
  return result;
};
