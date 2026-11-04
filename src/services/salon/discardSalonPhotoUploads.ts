"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

/**
 * `POST /salons/:id/photo-uploads/discard` (branch.profile): photos uploaded
 * into the Photos draft that were never saved. The API deletes those in the
 * branch's own Cloudinary folder that the salon doesn't list; anything else
 * is ignored, so sending a pasted link or a saved photo is harmless.
 */
export const discardSalonPhotoUploads = async (
  salonId: string,
  urls: string[],
): Promise<ApiResponse<null>> => {
  if (urls.length === 0) return { success: true, message: "Nothing to discard" };
  try {
    const response = await serverFetch.post(
      `/salons/${encodeURIComponent(salonId)}/photo-uploads/discard`,
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urls.slice(0, 20) }),
      },
    );
    return (await response.json()) as ApiResponse<null>;
  } catch (error) {
    console.error("discardSalonPhotoUploads error:", error);
    return { success: false, message: "Couldn't clean up discarded photos." };
  }
};
