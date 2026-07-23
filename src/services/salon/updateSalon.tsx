"use server";

import { serverFetch } from "@/lib/server-fetch";
import { revalidateTag } from "next/cache";
import type { ApiResponse, Salon } from "@/lib/api-types";

export const updateSalon = async (
  _currentState: ApiResponse<Salon> | null,
  formData: FormData,
): Promise<ApiResponse<Salon>> => {
  try {
    const salonId = formData.get("id") as string;

    const rawData = {
      name: formData.get("name") as string,
      website: formData.get("website") as string,
      description: formData.get("description") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipCode: formData.get("zipCode") as string,
    };

    const operatingHours = JSON.parse(
      (formData.get("operatingHours") as string) || "{}",
    );

    const payload = {
      ...rawData,
      operatingHours,
    };

    const response = await serverFetch.patch(`/salons/${salonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<Salon> = await response.json();

    if (result.success) {
      revalidateTag("salons", "seconds");
      revalidateTag(`salon-${salonId}`, "seconds");
      revalidateTag("my-salons", "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("updateSalon error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Update Failed. Please check your input and try again.",
    };
  }
};
