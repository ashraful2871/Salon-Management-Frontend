"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";

/** Deletes the original photo and every result made from it. */
export const deleteTryOnPhoto = async (
  uploadId: string,
  ownerToken: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.delete(
      `/hairstyle/uploads/${encodeURIComponent(uploadId)}`,
      {
        headers: {
          "X-Tryon-Token": ownerToken,
          ...(await clientIpHeaders()),
        },
        cache: "no-store",
      },
    );

    return (await response.json()) as ApiResponse<null>;
  } catch (error) {
    console.error("Error deleting try-on photo:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't delete your photo. Please try again.",
    };
  }
};
