import { serverFetch } from "@/lib/server-fetch";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const addStaff = async (
  _currentState: any,
  formData: any,
): Promise<any> => {
  try {
    const staffData = {
      salonId: formData.get("salonId"),
      email: formData.get("email"),
      speciality: formData.get("speciality"),
      experience: Number(formData.get("experience")),
      bio: formData.get("bio"),
    };

    const res = await serverFetch.post("/staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(staffData),
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
