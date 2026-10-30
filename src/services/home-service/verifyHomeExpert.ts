"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeExpertRow } from "./types";

/** `POST /admin/home-service/experts/:id/verify`: the expert can be booked (owner emailed). */
export const verifyHomeExpert = async (id: string, reason?: string): Promise<ApiResponse<HomeExpertRow>> => {
  const result = await adminHomeAction<HomeExpertRow>(`/experts/${enc(id)}/verify`, { reason }, "Couldn't update the expert. Please try again.");
  if (result.success) revalidateTag(TAGS.homeExpert(id), "max");
  return result;
};
