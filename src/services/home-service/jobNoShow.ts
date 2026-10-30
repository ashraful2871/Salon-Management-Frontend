"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { jobAction } from "./job-action";
import type { HomeEndResult } from "./types";

/** `POST /home-service/jobs/:id/no-show`: the customer isn't home (after the wait); the policy decides the fee. */
export const jobNoShow = async (id: string): Promise<ApiResponse<HomeEndResult>> => {
  const result = await jobAction<HomeEndResult>(id, "no-show", undefined, "Couldn't mark the visit. Please try again.");
  if (result.success) revalidateTag(TAGS.adminHome, "max");
  return result;
};
