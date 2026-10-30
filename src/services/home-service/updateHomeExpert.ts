"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { ownerAction } from "./owner-action";
import type { HomeExpertRow, HomeExpertUpdateInput } from "./types";

/** `PATCH /home-service/owner/experts/:id`. Gender only while DRAFT or REJECTED. */
export const updateHomeExpert = async (
  salonId: string,
  id: string,
  input: HomeExpertUpdateInput,
): Promise<ApiResponse<HomeExpertRow>> => {
  const result = await ownerAction<HomeExpertRow>(salonId, "patch", `/experts/${enc(id)}`, input, "Couldn't update the expert. Please try again.");
  if (result.success) revalidateTag(TAGS.homeExpert(id), "max");
  return result;
};
