/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";

export const createService = async (
  _currentState: any,
  formData: any,
): Promise<any> => {
  try {
    const payload = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      price: Number(formData.get("price")),
      duration: Number(formData.get("duration")),
      salonId: formData.get("salonId") as string,
    };

    const imagesRaw = formData.get("images") as string;
    const images = imagesRaw ? JSON.parse(imagesRaw) : [];
    
    if (images.length > 0) {
      (payload as any).images = images;
    }

    const response = await serverFetch.post("/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.log(error);
    return {
      success: false,
      message: `${
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to create service."
      }`,
    };
  }
};
