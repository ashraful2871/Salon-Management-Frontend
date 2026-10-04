"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";

/**
 * Tells the API the direct upload finished. It checks Cloudinary's signature
 * and that the photo shows one face; a 422 message says why it didn't.
 */
export const confirmTryOnUpload = async (
  uploadId: string,
  ownerToken: string,
  upload: { version: number | string; signature: string },
): Promise<ApiResponse<{ beforeUrl: string }>> => {
  try {
    const response = await serverFetch.post(
      `/hairstyle/uploads/${encodeURIComponent(uploadId)}/confirm`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Tryon-Token": ownerToken,
          ...(await clientIpHeaders()),
        },
        body: JSON.stringify(upload),
        cache: "no-store",
      },
    );

    return (await response.json()) as ApiResponse<{ beforeUrl: string }>;
  } catch (error) {
    console.error("Error confirming try-on upload:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't check your photo. Please try again.",
    };
  }
};
