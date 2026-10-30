"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc } from "./request";
import { ownerAction } from "./owner-action";

/** `DELETE /home-service/owner/offerings/:id`: also unlinks it from every expert. */
export const deleteHomeOffering = async (salonId: string, id: string): Promise<ApiResponse<{ id: string }>> =>
  ownerAction<{ id: string }>(salonId, "delete", `/offerings/${enc(id)}`, undefined, "Couldn't remove the service. Please try again.");
