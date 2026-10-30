import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { enc, homeSend } from "./request";

/**
 * One step of a visit by its expert (`POST /home-service/jobs/:id/<step>`),
 * from inside a server action. The expert's list is on screen; the customer's
 * visit and the branch's board change with it.
 */
export const jobAction = async <T>(
  id: string,
  step: string,
  body: unknown,
  fallback: string,
  headers?: Record<string, string>,
): Promise<ApiResponse<T>> => {
  const result = await homeSend<T>("post", `/home-service/jobs/${enc(id)}/${step}`, body, fallback, headers);
  if (result.success) {
    updateTag(TAGS.homeJobs);
    revalidateTag(TAGS.homeBooking(id), "max");
    revalidateTag(TAGS.myHomeBookings, "max");
    const salonId = (result.data as { salon?: { id?: string } } | undefined)?.salon?.id;
    if (salonId) revalidateTag(TAGS.ownerHomeServiceBookings(salonId), "max");
  }
  return result;
};
