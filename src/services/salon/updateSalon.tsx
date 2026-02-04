import { serverFetch } from "@/lib/server-fetch";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const updateSalon = async (
  _currentState: any,
  formData: any,
): Promise<any> => {
  try {
    const salonId = formData.get("id") as string;

    // 1. Extract Simple Fields
    const rawData = {
      name: formData.get("name") as string,
      website: formData.get("website") as string,
      description: formData.get("description") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipCode: formData.get("zipCode") as string,
    };

    // 2. Extract Complex Fields (JSON from hidden inputs)
    const operatingHours = JSON.parse(
      (formData.get("operatingHours") as string) || "{}",
    );

    // Construct Payload
    const payload = {
      ...rawData,
      operatingHours,
    };

    console.log("🔥 Server Action Processing Update for:", salonId);
    console.log("📦 Payload:", payload);

    const response = await serverFetch.patch(`/salons/${salonId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("📦 Response:", result);
    return;
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
          : "Update Failed. Please check your input and try again."
      }`,
    };
  }
};
