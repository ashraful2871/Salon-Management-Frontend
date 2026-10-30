"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc } from "./request";
import { ownerAction } from "./owner-action";
import type { HomeOffering, HomeOfferingInput } from "./types";

/** `PATCH /home-service/owner/offerings/:id`. New prices apply to new bookings only. */
export const updateHomeOffering = async (
  salonId: string,
  id: string,
  input: Partial<HomeOfferingInput>,
): Promise<ApiResponse<HomeOffering>> =>
  ownerAction<HomeOffering>(salonId, "patch", `/offerings/${enc(id)}`, input, "Couldn't update the service. Please try again.");
