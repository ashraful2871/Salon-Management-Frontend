import { serverFetch, type FetchCacheStrategy } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AdminReferralMeta } from "./types";

/**
 * Shared plumbing for the `/referrals/*` and `/admin/referrals/*` services:
 * every function returns `ApiResponse<T>` and never throws. The real error in
 * development, `fallback` in production.
 */

/** Customer lists send `{ page, limit, total }`; admin lists add `totalPages` and `piiMasked`. */
export type ReferralListResponse<T, M = { page: number; limit: number; total: number }> = Omit<
  ApiResponse<T>,
  "meta"
> & { meta?: M };

export type AdminReferralListResponse<T> = ReferralListResponse<T, AdminReferralMeta>;

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
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const enc = encodeURIComponent;

export const referralGet = async <T>(
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

export const referralSend = async <T>(
  method: "post" | "patch",
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
