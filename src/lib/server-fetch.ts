import {
  getValidAccessToken,
  refreshAccessToken,
} from "@/services/auth/session";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type FetchCacheStrategy = {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  cache?: "force-cache" | "no-store";
};

/**
 * Every server-side call to the API goes out with a token that has already been
 * checked for life, and is retried once against a renewed one if the API
 * disagrees.
 *
 * The retry is the belt to the proxy's braces. The proxy renews on navigation
 * and `getValidAccessToken` renews on expiry, but neither can help with a token
 * that is rejected for a reason the frontend cannot see - a clock a few minutes
 * out between Vercel and Render is enough. Retrying a 401 is safe for any verb:
 * a 401 comes from the `auth()` middleware, before the handler runs, so the
 * first attempt changed nothing.
 */
const serverFetchHelper = async (
  endPoint: string,
  options: RequestInit & FetchCacheStrategy,
): Promise<Response> => {
  const { headers, ...restOptions } = options;

  const send = (token: string | null) =>
    fetch(`${BACKEND_API_URL}${endPoint}`, {
      headers: {
        Cookie: token ? `accessToken=${token}` : "",
        ...headers,
      },
      ...restOptions,
      credentials: "include",
    });

  const accessToken = await getValidAccessToken();
  const response = await send(accessToken);

  if (response.status !== 401) return response;

  const renewed = await refreshAccessToken();

  // `refreshAccessToken` is memoised per request, so this may hand back the
  // very token that was just refused - by a sibling component a moment ago, or
  // because the account itself is the problem. Retrying with it would only
  // collect the same 401.
  if (!renewed || renewed === accessToken) return response;

  return send(renewed);
};

export const serverFetch = {
  get: (
    endPoint: string,
    options: RequestInit & FetchCacheStrategy = {},
  ): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "GET" }),

  post: (
    endPoint: string,
    options: RequestInit & FetchCacheStrategy = {},
  ): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "POST" }),

  put: (
    endPoint: string,
    options: RequestInit & FetchCacheStrategy = {},
  ): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "PUT" }),

  patch: (
    endPoint: string,
    options: RequestInit & FetchCacheStrategy = {},
  ): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "PATCH" }),

  delete: (
    endPoint: string,
    options: RequestInit & FetchCacheStrategy = {},
  ): Promise<Response> =>
    serverFetchHelper(endPoint, { ...options, method: "DELETE" }),
};
