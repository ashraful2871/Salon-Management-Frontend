/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverFetch } from "@/lib/server-fetch";

export const getAllServices = async (salonId?: string) => {
  try {
    const url = salonId ? `/services?salonId=${salonId}` : "/services";
    const response = await serverFetch.get(url);

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      message: `${
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong"
      }`,
    };
  }
};
