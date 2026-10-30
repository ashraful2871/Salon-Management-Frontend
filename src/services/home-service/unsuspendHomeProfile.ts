"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeServiceProfile } from "./types";

/** `POST /admin/home-service/profiles/:id/unsuspend`: back to ACTIVE if it was ever approved, else to review. */
export const unsuspendHomeProfile = async (id: string, reason?: string): Promise<ApiResponse<HomeServiceProfile>> =>
  adminHomeAction<HomeServiceProfile>(`/profiles/${enc(id)}/unsuspend`, { reason }, "Couldn't update the branch. Please try again.");
