import { revalidateTag, updateTag } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import { homeSend } from "./request";

/**
 * An owner write under `/home-service/owner/*`, from inside a server action.
 * The branch's Home Service page is on screen; the public lists and the back
 * office follow at their next read.
 */
export const ownerAction = async <T>(
  salonId: string,
  method: "post" | "put" | "patch" | "delete",
  path: string,
  body: unknown,
  fallback: string,
): Promise<ApiResponse<T>> => {
  const result = await homeSend<T>(method, `/home-service/owner${path}`, body, fallback);
  if (result.success) {
    updateTag(TAGS.ownerHomeService(salonId));
    revalidateTag(TAGS.homeCatalog, "max");
    revalidateTag(TAGS.adminHome, "max");
  }
  return result;
};

/** A write on the branch's bookings board: the visit moves for its customer and expert too. */
export const ownerBookingAction = async <T>(
  salonId: string,
  id: string,
  step: string,
  body: unknown,
  fallback: string,
): Promise<ApiResponse<T>> => {
  const result = await homeSend<T>("post", `/home-service/owner/bookings/${encodeURIComponent(id)}/${step}`, body, fallback);
  if (result.success) {
    updateTag(TAGS.ownerHomeServiceBookings(salonId));
    revalidateTag(TAGS.homeBooking(id), "max");
    revalidateTag(TAGS.myHomeBookings, "max");
    revalidateTag(TAGS.homeJobs, "max");
    revalidateTag(TAGS.adminHome, "max");
  }
  return result;
};
