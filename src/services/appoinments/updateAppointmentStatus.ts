/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";

export const updateAppointmentStatus = async (
  id: string,
  status: string
): Promise<any> => {
  try {
    const response = await serverFetch.patch(`/appointments/${id}/status`, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
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
          : "Failed to update appointment status."
      }`,
    };
  }
};
