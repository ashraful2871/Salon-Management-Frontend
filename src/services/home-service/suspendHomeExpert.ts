"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeExpertRow } from "./types";

/** `POST /admin/home-service/experts/:id/suspend`: unbookable at once; upcoming visits move to another expert or are cancelled. */
export const suspendHomeExpert = async (id: string, reason: string): Promise<ApiResponse<HomeExpertRow>> => {
  const result = await adminHomeAction<HomeExpertRow>(`/experts/${enc(id)}/suspend`, { reason }, "Couldn't update the expert. Please try again.");
  if (result.success) revalidateTag(TAGS.homeExpert(id), "max");
  return result;
};
