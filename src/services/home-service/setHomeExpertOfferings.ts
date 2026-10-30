"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { ownerAction } from "./owner-action";
import type { HomeExpertRow } from "./types";

/** `PUT /home-service/owner/experts/:id/offerings`: the services this expert does (their side only). */
export const setHomeExpertOfferings = async (
  salonId: string,
  id: string,
  offeringIds: string[],
): Promise<ApiResponse<HomeExpertRow>> => {
  const result = await ownerAction<HomeExpertRow>(
    salonId,
    "put",
    `/experts/${enc(id)}/offerings`,
    { offeringIds },
    "Couldn't link the services. Please try again.",
  );
  if (result.success) revalidateTag(TAGS.homeExpert(id), "max");
  return result;
};
