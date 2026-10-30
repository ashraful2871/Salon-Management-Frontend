"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerAction } from "./owner-action";
import type { HomeOffering, HomeOfferingCreateInput } from "./types";

/** `POST /home-service/owner/offerings`. The audience can't be changed afterwards. */
export const createHomeOffering = async (input: HomeOfferingCreateInput): Promise<ApiResponse<HomeOffering>> =>
  ownerAction<HomeOffering>(input.salonId, "post", "/offerings", input, "Couldn't add the service. Please try again.");
