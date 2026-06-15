/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";

export const updateService = async (
  id: string,
  data: { name?: string; price?: number; duration?: number; description?: string; category?: string }
): Promise<any> => {
  try {
    const response = await serverFetch.patch(`/services/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      message: `${
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to update service."
      }`,
    };
  }
};
