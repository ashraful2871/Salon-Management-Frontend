"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { SalonPhotoTicket } from "./salon-photo-types";

/**
 * A signed ticket for uploading salon photos straight to Cloudinary. With a
 * salon id it is that branch's folder (branch.profile); without one it is for
 * a salon being added (owners only). Changes nothing: the photo's URL is saved
 * afterwards with `updateSalonPhotos` or `createSalon`.
 */
export const getSalonPhotoTicket = async (
  salonId?: string,
): Promise<ApiResponse<SalonPhotoTicket>> => {
  try {
    const path = salonId
      ? `/salons/${encodeURIComponent(salonId)}/photo-upload-signature`
      : "/salons/photo-upload-signature";
    const response = await serverFetch.post(path, {
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return (await response.json()) as ApiResponse<SalonPhotoTicket>;
  } catch (error) {
    console.error("getSalonPhotoTicket error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't prepare the upload. Please try again.",
    };
  }
};
