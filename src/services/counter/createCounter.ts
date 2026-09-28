"use server";

import { serverFetch } from "@/lib/server-fetch";
import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import type { ApiResponse } from "@/lib/api-types";

export type AddCounterPayload = {
  name: string;
  code?: string;
  salonId: string;
};

export const createCounter = async (
  _prevState: ApiResponse<null> | null,
  formData: FormData,
): Promise<ApiResponse<null>> => {
  try {
    const payload: AddCounterPayload = {
      name: formData.get("name") as string,
      code: (formData.get("code") as string) || undefined,
      salonId: formData.get("salonId") as string,
    };

    const response = await serverFetch.post("/counters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<null> = await response.json();

    if (result.success) {
      updateTag(TAGS.mySalons);
      updateTag(TAGS.staff(payload.salonId));
      // The manage-salon page lists counters from the salon record itself.
      updateTag(TAGS.salon(payload.salonId));
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("createCounter error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to create counter.",
    };
  }
};
