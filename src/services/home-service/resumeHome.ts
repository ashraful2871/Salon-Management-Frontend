"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerAction } from "./owner-action";
import type { HomeServiceProfile } from "./types";

/** `POST /home-service/owner/profile/resume` (business owner only). */
export const resumeHome = async (salonId: string, reason?: string): Promise<ApiResponse<HomeServiceProfile>> =>
  ownerAction<HomeServiceProfile>(salonId, "post", "/profile/resume", { salonId, reason }, "Couldn't resume Home Service. Please try again.");
