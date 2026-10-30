"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerAction } from "./owner-action";
import type { HomeProfileSettingsInput, HomeServiceProfile } from "./types";

/** `PUT /home-service/owner/profile`: radius, travel fee, minimum order, buffer and hours, inside the platform caps. */
export const updateHomeProfile = async (input: HomeProfileSettingsInput): Promise<ApiResponse<HomeServiceProfile>> =>
  ownerAction<HomeServiceProfile>(input.salonId, "put", "/profile", input, "Couldn't save the settings. Please try again.");
