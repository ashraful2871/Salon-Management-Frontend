/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";

export const cancelAppointment = async (id: string): Promise<any> => {
  try {
    const response = await serverFetch.delete(`/appointments/${id}`, {
      method: "DELETE",
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
          : "Failed to cancel appointment."
      }`,
    };
  }
};
