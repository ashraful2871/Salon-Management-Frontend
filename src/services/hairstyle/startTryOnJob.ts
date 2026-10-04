"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import type { TryOnJobStatus } from "./types";

/**
 * Starts a try-on, or returns the one already made for this photo, style and
 * colour (repeats are free). A FAILED job is retried by posting it again.
 */
export const startTryOnJob = async (
  uploadId: string,
  ownerToken: string,
  styleId: string,
  colorId: string,
): Promise<ApiResponse<{ jobId: string; status: TryOnJobStatus }>> => {
  try {
    const response = await serverFetch.post("/hairstyle/jobs", {
      headers: {
        "Content-Type": "application/json",
        "X-Tryon-Token": ownerToken,
        ...(await clientIpHeaders()),
      },
      body: JSON.stringify({ uploadId, styleId, colorId }),
      cache: "no-store",
    });

    return (await response.json()) as ApiResponse<{
      jobId: string;
      status: TryOnJobStatus;
    }>;
  } catch (error) {
    console.error("Error starting try-on job:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't start the try-on. Please try again.",
    };
  }
};
