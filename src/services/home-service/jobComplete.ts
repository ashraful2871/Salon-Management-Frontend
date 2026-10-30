"use server";

import type { ApiResponse } from "@/lib/api-types";
import { jobAction } from "./job-action";
import type { HomeJob, HomeJobCompleteInput } from "./types";

/** `POST /home-service/jobs/:id/complete` with how the balance was taken; the held advance settles to the salon. */
export const jobComplete = async (id: string, input: HomeJobCompleteInput): Promise<ApiResponse<HomeJob>> =>
  jobAction<HomeJob>(id, "complete", input, "Couldn't complete the visit. Please try again.");
