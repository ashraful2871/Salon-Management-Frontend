"use server";

import type { ApiResponse } from "@/lib/api-types";
import { jobAction } from "./job-action";
import type { HomeJob } from "./types";

/** `POST /home-service/jobs/:id/en-route`: the expert sets off (from `canSetOffFrom`, 3 h before the start); the address opens. */
export const jobEnRoute = async (id: string): Promise<ApiResponse<HomeJob>> =>
  jobAction<HomeJob>(id, "en-route", undefined, "Couldn't update the job. Please try again.");
