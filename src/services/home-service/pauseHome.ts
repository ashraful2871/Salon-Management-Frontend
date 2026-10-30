"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerAction } from "./owner-action";
import type { HomePauseInput, HomeServiceProfile } from "./types";

/** `POST /home-service/owner/profile/pause` (business owner only): hidden from new bookings until `until` (90 days if omitted). */
export const pauseHome = async (input: HomePauseInput): Promise<ApiResponse<HomeServiceProfile>> =>
  ownerAction<HomeServiceProfile>(input.salonId, "post", "/profile/pause", input, "Couldn't pause Home Service. Please try again.");
