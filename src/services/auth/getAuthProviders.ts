import type { ApiResponse } from "@/lib/api-types";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type AuthProviders = { google: boolean };

const NONE: AuthProviders = { google: false };

/**
 * Which extra sign-in providers the API has switched on. Asked of the API so
 * that clearing `GOOGLE_CLIENT_ID` on Render hides the button here with nothing
 * to redeploy on Vercel. A down API reads as none: a button that can only fail
 * is worse than no button.
 *
 * Bare `fetch`, no cookie: the answer is the same for every visitor, so they
 * all share one cached copy.
 */
export const getAuthProviders = async (): Promise<AuthProviders> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/providers`, {
      next: { revalidate: 300, tags: ["auth-providers"] },
    });
    if (!response.ok) return NONE;

    const result = (await response.json()) as ApiResponse<AuthProviders>;
    return { google: Boolean(result.success && result.data?.google) };
  } catch {
    return NONE;
  }
};
