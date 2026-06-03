/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";

export const deleteService = async (id: string): Promise<any> => {
  try {
    const response = await serverFetch.delete(`/services/${id}`, {
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
          : "Failed to delete service."
      }`,
    };
  }
};
