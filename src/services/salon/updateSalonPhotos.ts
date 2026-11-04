"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse, Salon } from "@/lib/api-types";

/**
 * `PATCH /salons/:id` with only `images` (branch.profile): the whole photo
 * list in order, the first being the cover. Photos dropped from the list that
 * were uploaded to this branch are deleted from Cloudinary by the API.
 */
export const updateSalonPhotos = async (
  salonId: string,
  images: string[],
): Promise<ApiResponse<Salon>> => {
  try {
    const response = await serverFetch.patch(`/salons/${encodeURIComponent(salonId)}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });
    const result: ApiResponse<Salon> = await response.json();

    if (result.success) {
      updateTag(TAGS.salon(salonId));
      updateTag(TAGS.mySalons);
      revalidateTag(TAGS.salons, "max");
      revalidateTag(TAGS.salonCompleteness, "max");
    }
    return result;
  } catch (error) {
    console.error("updateSalonPhotos error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't save the photos. Please try again.",
    };
  }
};
