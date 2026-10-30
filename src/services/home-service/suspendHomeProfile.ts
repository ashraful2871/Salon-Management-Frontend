"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeServiceProfile } from "./types";

/** `POST /admin/home-service/profiles/:id/suspend`: hidden at once; upcoming visits are cancelled with a full refund. */
export const suspendHomeProfile = async (id: string, reason: string): Promise<ApiResponse<HomeServiceProfile>> => {
  const result = await adminHomeAction<HomeServiceProfile>(
    `/profiles/${enc(id)}/suspend`,
    { reason },
    "Couldn't update the branch. Please try again.",
  );
  if (result.success && result.data) {
    revalidateTag(TAGS.ownerHomeServiceBookings(result.data.salonId), "max");
    revalidateTag(TAGS.myHomeBookings, "max");
    revalidateTag(TAGS.homeJobs, "max");
  }
  return result;
};
