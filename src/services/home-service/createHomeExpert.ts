"use server";

import type { ApiResponse } from "@/lib/api-types";
import { ownerAction } from "./owner-action";
import type { HomeExpertCreateInput, HomeExpertRow } from "./types";

/** `POST /home-service/owner/experts`: a DRAFT expert from a staff member. FEMALE = Ladies, MALE = Gents. */
export const createHomeExpert = async (input: HomeExpertCreateInput): Promise<ApiResponse<HomeExpertRow>> =>
  ownerAction<HomeExpertRow>(input.salonId, "post", "/experts", input, "Couldn't add the expert. Please try again.");
