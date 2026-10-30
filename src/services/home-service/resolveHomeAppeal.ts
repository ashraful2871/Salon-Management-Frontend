"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc } from "./request";
import { adminHomeAction } from "./admin-action";
import type { HomeAppealStatus } from "./types";

type Resolved = { id: string; appealStatus: HomeAppealStatus; refundedMinor: number };

/**
 * `PATCH /admin/home-service/bookings/:id/appeal` (appeals.resolve, no
 * step-up): upholding returns the kept fee to the customer's wallet.
 */
export const resolveHomeAppeal = async (
  id: string,
  approve: boolean,
  note?: string,
): Promise<ApiResponse<Resolved>> => {
  const result = await adminHomeAction<Resolved>(
    `/bookings/${enc(id)}/appeal`,
    { approve, note },
    "Couldn't record the decision. Please try again.",
    "patch",
  );
  if (result.success) {
    updateTag(TAGS.adminAppeals);
    revalidateTag(TAGS.homeBooking(id), "max");
    revalidateTag(TAGS.myHomeBookings, "max");
  }
  return result;
};
