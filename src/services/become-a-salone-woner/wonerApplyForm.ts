import { serverFetch } from "@/lib/server-fetch";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const ownerApplyForm = async (
  _currentState: any,
  formData: any
): Promise<any> => {
  try {
    const payload = {
      businessName: formData.get("businessName"),
      businessAddress: formData.get("businessAddress"),
      businessPhone: formData.get("businessPhone"),
      businessEmail: formData.get("businessEmail"),
      documentUrl: formData.get("documentUrl"),
    };

    const res = await serverFetch.post(`/become-salon-owner/apply`, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (!res.ok) {
      return { success: false, message: result.message || "Failed to submit application." };
    }

    return {
      success: true,
      message: result.message || "Application submitted successfully",
      data: result.data,
    };
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
