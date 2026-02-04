/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { AddSalonPayload } from "@/components/Dashboard/AddSalonModal";
import { serverFetch } from "@/lib/server-fetch";

export const createSalon = async (
  _currentState: any,
  formData: any,
): Promise<any> => {
  try {
    // 1. Extract Simple Fields
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      website: formData.get("website") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      country: formData.get("country") as string,
      zipCode: formData.get("zipCode") as string,
    };

    // 2. Extract Complex Fields (JSON parsed from hidden inputs)
    const imagesRaw = formData.get("images") as string;
    const hoursRaw = formData.get("operatingHours") as string;

    const images = imagesRaw ? JSON.parse(imagesRaw) : [];
    const operatingHours = hoursRaw ? JSON.parse(hoursRaw) : {};

    // 3. Construct Final Payload
    const payload: AddSalonPayload = {
      ...rawData,
      images,
      operatingHours,
    };

    // 4. Perform your DB logic here (Simulated delay)

    const response = await serverFetch.post("/salons", {
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
          : "Login Failed. You might have entered incorrect email or password."
      }`,
    };
  }
};
