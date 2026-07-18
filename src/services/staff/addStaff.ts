"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { revalidateTag } from "next/cache";

export const addStaff = async (
  _currentState: ApiResponse<null> | null,
  formData: FormData,
): Promise<ApiResponse<null>> => {
  try {
    const staffData = {
      salonId: formData.get("salonId")?.toString(),
      email: formData.get("email")?.toString(),
      speciality: formData.get("speciality")?.toString(),
      experience: Number(formData.get("experience")),
      bio: formData.get("bio")?.toString(),
    };

    const res = await serverFetch.post("/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffData),
    });

    const result: ApiResponse<null> = await res.json();

    if (result.success) {
      revalidateTag("my-salons", "seconds");
      revalidateTag(`staff-${staffData.salonId}`, "seconds");
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("addStaff error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to add staff member.",
    };
  }
};
