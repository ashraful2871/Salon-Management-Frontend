"use server";

import { revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { ownerAction } from "./owner-action";
import type { HomeTurnOffInput, HomeTurnOffResult } from "./types";

/**
 * `POST /home-service/owner/profile/turn-off` (business owner only). `KEEP`
 * lets booked visits go ahead; `CANCEL` cancels the upcoming ones with a full
 * refund (salon at fault). Visits already under way always go ahead.
 */
export const turnOffHome = async (input: HomeTurnOffInput): Promise<ApiResponse<HomeTurnOffResult>> => {
  const result = await ownerAction<HomeTurnOffResult>(
    input.salonId,
    "post",
    "/profile/turn-off",
    input,
    "Couldn't turn off Home Service. Please try again.",
  );
  if (result.success && input.upcoming === "CANCEL") {
    revalidateTag(TAGS.ownerHomeServiceBookings(input.salonId), "max");
    revalidateTag(TAGS.myHomeBookings, "max");
    revalidateTag(TAGS.homeJobs, "max");
  }
  return result;
};
