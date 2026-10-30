"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { jobAction } from "./job-action";
import type { HomeAbortKind, HomeEndResult } from "./types";

/**
 * `POST /home-service/jobs/:id/abort`: stop a visit for a mismatch (not the
 * booked person or side) or for the expert's safety. A safety abort files a
 * report and refunds the customer in full.
 */
export const jobAbort = async (
  id: string,
  kind: HomeAbortKind,
  reason: string,
): Promise<ApiResponse<HomeEndResult>> => {
  const result = await jobAction<HomeEndResult>(id, "abort", { kind, reason }, "Couldn't stop the visit. Please try again.");
  if (result.success) revalidateTag(TAGS.adminHome, "max");
  return result;
};
