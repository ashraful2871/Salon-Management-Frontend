import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

export const changePassword = async (
  oldPassword: string,
  newPassword: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.post("/auth/change-password", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const result: ApiResponse<null> = await response.json();
    return result;
  } catch (error) {
    console.error("changePassword error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to change password.",
    };
  }
};
