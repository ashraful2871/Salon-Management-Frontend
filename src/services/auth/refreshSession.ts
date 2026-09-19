import type { ApiResponse } from "@/lib/api-types";

/**
 * The one call that trades a refresh token for a fresh pair at the API.
 *
 * Kept free of `next/headers` and `jsonwebtoken` on purpose: this runs in the
 * Edge middleware as well as in Node, and importing either would break it
 * there.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type RefreshedSession = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Why three outcomes instead of a nullable token.
 *
 * "The API rejected this token" and "the API did not answer" look identical to
 * a caller that only gets `null`, and they call for opposite responses: the
 * first means the session really is over and the cookies should go, the second
 * means a deploy or a cold Render instance got in the way and the cookies must
 * be kept so the next request can try again. Collapsing them is how a thirty
 * second backend blip turns into every signed-in user being logged out.
 */
export type RefreshOutcome =
  | { status: "refreshed"; session: RefreshedSession }
  | { status: "rejected" }
  | { status: "unavailable" };

export const refreshSession = async (
  refreshToken: string,
): Promise<RefreshOutcome> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Sent in the body rather than as a cookie: the caller is a server, and
      // the API accepts either.
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      return { status: "rejected" };
    }

    if (!response.ok) {
      return { status: "unavailable" };
    }

    const result = (await response.json()) as ApiResponse<RefreshedSession>;

    if (!result.success || !result.data?.accessToken) {
      return { status: "rejected" };
    }

    return {
      status: "refreshed",
      session: {
        accessToken: result.data.accessToken,
        // An older API that only reissues the access token keeps working: the
        // refresh token it did not replace is still the valid one.
        refreshToken: result.data.refreshToken || refreshToken,
      },
    };
  } catch (error) {
    console.error("refreshSession error:", error);
    return { status: "unavailable" };
  }
};
