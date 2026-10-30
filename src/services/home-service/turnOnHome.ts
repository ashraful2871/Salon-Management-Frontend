"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerAction } from "./owner-action";
import type { HomeServiceProfile, HomeTurnOnInput } from "./types";

/**
 * `POST /home-service/owner/profile/turn-on` (business owner only). The first
 * time goes to review (`status: PENDING_REVIEW`); a failing checklist answers
 * `HOME_SERVICE_OFF_CHECKLIST` with `details.failing`.
 */
export const turnOnHome = async (input: HomeTurnOnInput): Promise<ApiResponse<HomeServiceProfile>> =>
  ownerAction<HomeServiceProfile>(input.salonId, "post", "/profile/turn-on", input, "Couldn't turn on Home Service. Please try again.");
