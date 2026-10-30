"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc } from "./request";
import { ownerAction } from "./owner-action";
import type { HomeOffering } from "./types";

/** `POST /home-service/owner/offerings/:id/toggle`: show or hide the service. */
export const toggleHomeOffering = async (salonId: string, id: string): Promise<ApiResponse<HomeOffering>> =>
  ownerAction<HomeOffering>(salonId, "post", `/offerings/${enc(id)}/toggle`, undefined, "Couldn't change the service. Please try again.");
