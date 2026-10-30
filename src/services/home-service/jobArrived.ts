"use server";

import type { ApiResponse } from "@/lib/api-types";
import { jobAction } from "./job-action";
import type { HomeJob } from "./types";

/** `POST /home-service/jobs/:id/arrived`: the expert is at the door. */
export const jobArrived = async (id: string): Promise<ApiResponse<HomeJob>> =>
  jobAction<HomeJob>(id, "arrived", undefined, "Couldn't update the job. Please try again.");
