"use server";

import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { enc, homeSend } from "./request";
import type { HomeReviewInput } from "./types";

type CreatedReview = { id: string; rating: number; comment: string | null; status: string; createdAt: string };

/** `POST /home-service/bookings/:id/review`: one review per completed visit (`ALREADY_REVIEWED`). */
export const reviewHomeBooking = async (
  id: string,
  input: HomeReviewInput,
  expertId: string,
): Promise<ApiResponse<CreatedReview>> => {
  const result = await homeSend<CreatedReview>(
    "post",
    `/home-service/bookings/${enc(id)}/review`,
    input,
    "Couldn't post your review. Please try again.",
    await clientIpHeaders(),
  );
  if (result.success) {
    updateTag(TAGS.homeBooking(id));
    updateTag(TAGS.myHomeBookings);
    revalidateTag(TAGS.homeExpert(expertId), "max");
    revalidateTag(TAGS.homeCatalog, "max");
    revalidateTag(TAGS.ownerReviews, "max");
    revalidateTag(TAGS.adminReviews, "max");
  }
  return result;
};
