"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import type { UploadTicket } from "./types";

export const createTryOnUpload = async (
  turnstileToken: string,
): Promise<ApiResponse<UploadTicket>> => {
  try {
    const response = await serverFetch.post("/hairstyle/uploads", {
      headers: {
        "Content-Type": "application/json",
        ...(await clientIpHeaders()),
      },
      body: JSON.stringify({ turnstileToken }),
      cache: "no-store",
    });

    return (await response.json()) as ApiResponse<UploadTicket>;
  } catch (error) {
    console.error("Error creating try-on upload:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't start the upload. Please try again.",
    };
  }
};
