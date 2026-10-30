import { serverFetch, type FetchCacheStrategy } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { HomePageMeta } from "./types";

/**
 * Shared plumbing for the `/home-service/*` and `/admin/home-service/*`
 * services: every function returns `ApiResponse<T>` and never throws. The real
 * error in development, `fallback` in production.
 */

/** Home lists send `{ page, limit, total, totalPages? }`, not the salon list's `totalPage`. */
export type HomeListResponse<T> = Omit<ApiResponse<T>, "meta"> & { meta?: HomePageMeta };

const failure = (label: string, error: unknown, fallback: string): ApiResponse<never> => {
  console.error(`${label} error:`, error);
  return {
    success: false,
    message: process.env.NODE_ENV === "development" ? (error as Error).message : fallback,
  };
};

/** `?a=1&b=2` from the set values only (arrays joined with commas); "" when none are set. */
export const toQuery = (
  params: Record<string, string | number | boolean | string[] | undefined | null>,
) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const homeGet = async <T>(
  path: string,
  options: FetchCacheStrategy & { headers?: Record<string, string> },
  fallback: string,
): Promise<ApiResponse<T>> => {
  try {
    const response = await serverFetch.get(path, options);
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    return failure(`GET ${path}`, error, fallback);
  }
};

export const homeSend = async <T>(
  method: "post" | "put" | "patch" | "delete",
  path: string,
  body: unknown,
  fallback: string,
  headers: Record<string, string> = {},
): Promise<ApiResponse<T>> => {
  try {
    const response = await serverFetch[method](path, {
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    return failure(`${method.toUpperCase()} ${path}`, error, fallback);
  }
};

export const enc = encodeURIComponent;

/** `homeGet` for the paginated lists, typed with their own `meta`. */
export const homeGetList = <T>(
  path: string,
  options: FetchCacheStrategy & { headers?: Record<string, string> },
  fallback: string,
): Promise<HomeListResponse<T>> => homeGet<T>(path, options, fallback) as Promise<HomeListResponse<T>>;
