/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverFetch } from "@/lib/server-fetch";

export const getMyAppointments = async (salonId?: string, status?: string) => {
  try {
    let url = "/appointments/my-appointments?";
    if (salonId) url += `salonId=${salonId}&`;
    if (status) url += `status=${status}&`;

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
