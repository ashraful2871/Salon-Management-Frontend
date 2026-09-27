"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, SalonService } from "@/lib/api-types";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";
import { toMinor } from "@/lib/money";

export const createService = async (
  _currentState: ApiResponse<SalonService> | null,
  formData: FormData,
): Promise<ApiResponse<SalonService>> => {
  try {
    const payload: Record<string, unknown> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      priceMinor: toMinor(Number(formData.get("price"))),
      duration: Number(formData.get("duration")),
      salonId: formData.get("salonId") as string,
    };

    const imagesRaw = formData.get("images") as string;
    const images = imagesRaw ? JSON.parse(imagesRaw) : [];

    if (images.length > 0) {
      payload.images = images;
    }

    const response = await serverFetch.post("/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<SalonService> = await response.json();

    if (result.success) {
      updateTag(TAGS.services);
      updateTag(TAGS.myServices);
      revalidateTag(TAGS.mySalons, "max");
      if (typeof payload.salonId === "string") {
        revalidateTag(TAGS.salon(payload.salonId), "max");
      }
      revalidateTag(TAGS.salons, "max");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("createService error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to create service.",
    };
  }
};
