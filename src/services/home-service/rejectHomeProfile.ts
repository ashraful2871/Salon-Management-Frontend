"use server";

import type { ApiResponse } from "@/lib/api-types";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeServiceProfile } from "./types";

/** `POST /admin/home-service/profiles/:id/reject`: back to the owner with the reason; Home Service turns off. */
export const rejectHomeProfile = async (id: string, reason: string): Promise<ApiResponse<HomeServiceProfile>> =>
  adminHomeAction<HomeServiceProfile>(`/profiles/${enc(id)}/reject`, { reason }, "Couldn't update the branch. Please try again.");
