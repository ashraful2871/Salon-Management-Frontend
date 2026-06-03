"use server";

import { serverFetch } from "@/lib/server-fetch";

export type AddCounterPayload = {
  name: string;
  code?: string;
  salonId: string;
};

export const createCounter = async (prevState: any, formData: FormData) => {
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

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to create counter",
      };
    }

    return {
      success: true,
      message: result.message || "Counter created successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    };
  }
};
