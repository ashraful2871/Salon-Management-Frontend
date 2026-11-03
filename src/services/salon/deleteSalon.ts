"use server";

import { cookies } from "next/headers";
import { revalidateTag, updateTag } from "next/cache";
import { serverFetch } from "@/lib/server-fetch";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";
import { BRANCH_COOKIE, BRANCH_COOKIE_OPTIONS } from "@/lib/branch-cookie-name";

/**
 * `DELETE /salons/:id` (owners only): soft delete after typing the salon's
 * name. Refused (409) while upcoming or active home bookings remain; its
 * bookings, reviews and money records stay.
 */
export const deleteSalon = async (
  salonId: string,
  confirmName: string,
): Promise<ApiResponse<{ id: string; isDeleted: boolean }>> => {
  try {
    const response = await serverFetch.delete(`/salons/${encodeURIComponent(salonId)}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmName }),
    });
    const result: ApiResponse<{ id: string; isDeleted: boolean }> = await response.json();

    if (result.success) {
      updateTag(TAGS.mySalons);
      updateTag(TAGS.ownerAccess);
      updateTag(TAGS.salonCompleteness);
      revalidateTag(TAGS.salon(salonId), "max");
      revalidateTag(TAGS.salons, "max");
      revalidateTag(TAGS.ownerHomes, "max");

      // The branch switcher must not stay pinned to a branch that's gone.
      const jar = await cookies();
      if (jar.get(BRANCH_COOKIE)?.value === salonId) {
        jar.set(BRANCH_COOKIE, "all", BRANCH_COOKIE_OPTIONS);
      }
    }
    return result;
  } catch (error) {
    console.error("deleteSalon error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't delete the salon. Please try again.",
    };
  }
};
