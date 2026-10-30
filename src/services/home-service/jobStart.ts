"use server";

import type { ApiResponse } from "@/lib/api-types";
import { jobAction } from "./job-action";
import type { HomeJob } from "./types";

/**
 * `POST /home-service/jobs/:id/start` with the customer's 4-digit code.
 * A wrong code answers `START_CODE_INVALID` (tries left in `details`); the
 * fifth locks the visit (`START_CODE_LOCKED`, the branch can override).
 */
export const jobStart = async (id: string, code: string): Promise<ApiResponse<HomeJob>> =>
  jobAction<HomeJob>(id, "start", { code }, "Couldn't start the visit. Please try again.");
