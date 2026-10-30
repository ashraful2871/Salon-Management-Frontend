"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeExpertRow, ExpertGender } from "./types";

/** `POST /admin/home-service/experts/:id/gender`: corrects the gender (and so the side); the expert must be verified again. */
export const setHomeExpertGender = async (
  id: string,
  gender: ExpertGender,
  reason: string,
): Promise<ApiResponse<HomeExpertRow>> => {
  const result = await adminHomeAction<HomeExpertRow>(`/experts/${enc(id)}/gender`, { gender, reason }, "Couldn't update the expert. Please try again.");
  if (result.success) revalidateTag(TAGS.homeExpert(id), "max");
  return result;
};
