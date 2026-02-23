import { serverFetch } from "@/lib/server-fetch";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const bookingAppointment = async (
  _currentState: any,
  formData: any,
): Promise<any> => {
  try {
    const appointmentData = {
      salonId: formData.get("salonId")?.toString(),
      serviceId: formData.get("serviceId")?.toString(),
      staffId: formData.get("staffId")?.toString(),
      counterId: formData.get("counterId")?.toString(),
      appointmentDate: formData.get("appointmentDate")?.toString(),
      startTime: formData.get("startTime")?.toString(),
      notes: formData.get("notes")?.toString() || undefined,
    };

    const res = await serverFetch.post("/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointmentData),
    });

    const result = await res.json();
    console.log(result);
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
