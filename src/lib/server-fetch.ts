import { getCookie } from "@/services/auth/cookiesHandler";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type FetchCacheStrategy = {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  cache?: "force-cache" | "no-store";
};

const serverFetchHelper = async (
  endPoint: string,
  options: RequestInit & FetchCacheStrategy,
): Promise<Response> => {
  const { headers, ...restOptions } = options;
  const accessToken = await getCookie("accessToken");
  const response = await fetch(`${BACKEND_API_URL}${endPoint}`, {
    headers: {
      Cookie: accessToken ? `accessToken=${accessToken}` : "",
      ...headers,
    },
    ...restOptions,
    credentials: "include",
  });
  return response;
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
