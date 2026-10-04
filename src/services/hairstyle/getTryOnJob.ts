"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import type { TryOnJob } from "./types";

export const getTryOnJob = async (
  jobId: string,
  ownerToken: string,
): Promise<ApiResponse<TryOnJob>> => {
  try {
    const response = await serverFetch.get(
      `/hairstyle/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: {
          "X-Tryon-Token": ownerToken,
          ...(await clientIpHeaders()),
        },
        cache: "no-store",
      },
    );

    const result = (await response.json()) as ApiResponse<TryOnJob>;
    return result.data
      ? { ...result, data: { ...result.data, jobId } }
      : result;
  } catch (error) {
    console.error("Error fetching try-on job:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't check the try-on. Please try again.",
    };
  }
};
