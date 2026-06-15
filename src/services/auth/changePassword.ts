/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { serverFetch } from "@/lib/server-fetch";

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<any> => {
  try {
    const response = await serverFetch.post("/auth/change-password", {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ oldPassword, newPassword }),
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
          : "Failed to change password."
      }`,
    };
  }
};
