"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc } from "./request";
import { ownerAction } from "./owner-action";
import type { HomeExpertRow } from "./types";

/** `POST /home-service/owner/experts/:id/submit`: send for admin verification (needs all three documents). */
export const submitHomeExpert = async (salonId: string, id: string): Promise<ApiResponse<HomeExpertRow>> =>
  ownerAction<HomeExpertRow>(salonId, "post", `/experts/${enc(id)}/submit`, undefined, "Couldn't send for verification. Please try again.");
