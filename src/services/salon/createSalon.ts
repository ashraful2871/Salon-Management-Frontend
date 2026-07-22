"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Salon } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

interface CreateSalonPayload {
  name: string;
  description?: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  division: string;
  district: string;
  area: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  images: string[];
  operatingHours: Record<string, { open: string; close: string }>;
}

export const createSalon = async (
  _currentState: ApiResponse<Salon> | null,
  formData: FormData,
): Promise<ApiResponse<Salon>> => {
  try {
    const rawData = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || "",
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || "",
      website: (formData.get("website") as string) || "",
      address: formData.get("address") as string,
      division: formData.get("division") as string,
      district: formData.get("district") as string,
      area: formData.get("area") as string,
      city: formData.get("city") as string,
      state: (formData.get("state") as string) || "",
      country: formData.get("country") as string,
      zipCode: (formData.get("zipCode") as string) || "",
    };

    const imagesRaw = formData.get("images") as string;
    const hoursRaw = formData.get("operatingHours") as string;

    const images = imagesRaw ? JSON.parse(imagesRaw) : [];
    const operatingHours = hoursRaw ? JSON.parse(hoursRaw) : {};

    const payload: CreateSalonPayload = {
      ...rawData,
      images,
      operatingHours,
    };

    const response = await serverFetch.post("/salons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<Salon> = await response.json();

    if (result.success) {
      revalidateTag("salons", "seconds");
      revalidateTag("my-salons", "seconds");
    }

    if (!result.success && result.errorDetails) {
      return {
        ...result,
        message: `${result.message}: ${JSON.stringify(result.errorDetails)}`,
      };
    }
    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("createSalon error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to create salon. Please check your input.",
    };
  }
};
