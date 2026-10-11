import { serverFetch, type FetchCacheStrategy } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

/**
 * Shared plumbing for the `/admin/*` services: every function still returns
 * `ApiResponse<T>` and never throws. The real error in development, `fallback`
 * in production.
 */
const failure = (label: string, error: unknown, fallback: string): ApiResponse<never> => {
  console.error(`${label} error:`, error);
  return {
    success: false,
    message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
  };
};

/** `?a=1&b=2` from the set values only; "" when none are set. */
export const toQuery = (params: Record<string, string | number | boolean | undefined | null>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const adminGet = async <T>(
  path: string,
  options: FetchCacheStrategy,
  fallback: string,
): Promise<ApiResponse<T>> => {
  try {
    const response = await serverFetch.get(path, options);
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    return failure(`GET ${path}`, error, fallback);
  }
};

export const adminSend = async <T>(
  method: "post" | "patch" | "delete",
  path: string,
  body: unknown,
  fallback: string,
): Promise<ApiResponse<T>> => {
  try {
    const response = await serverFetch[method](path, {
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    return failure(`${method.toUpperCase()} ${path}`, error, fallback);
  }
};
