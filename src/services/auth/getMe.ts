import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

export type SignInMethod = "PASSWORD" | "GOOGLE";

/**
 * The part of `GET /auth/me` the settings screen reads. The JWT that
 * `getSessionUser` decodes says nothing about how the account signs in, so
 * this one asks the API. The API sends the whole profile; only these fields
 * are typed.
 */
export type AuthMe = {
  email: string;
  name?: string;
  profilePhoto?: string | null;
  hasPassword: boolean;
  signInMethods: SignInMethod[];
};

export const getMe = async (): Promise<ApiResponse<AuthMe>> => {
  try {
    const response = await serverFetch.get("/auth/me", { cache: "no-store" });
    return await response.json();
  } catch (error) {
    console.error("getMe error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load your account.",
    };
  }
};
