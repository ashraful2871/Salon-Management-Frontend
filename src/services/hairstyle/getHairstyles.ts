import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { HairCatalog } from "./types";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/**
 * Bare `fetch`, no cookie: the catalog is public and the same for everyone, and
 * reading the auth cookie (as `serverFetch` does) would make the home page,
 * which shows the try-on section, render dynamically.
 */
export const getHairstyles = async (): Promise<ApiResponse<HairCatalog>> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/hairstyle/styles`, {
      next: { revalidate: 3600, tags: [TAGS.hairstyles] },
      // A hung API must not hold the home page; the catch shows "coming back soon".
      signal: AbortSignal.timeout(2500),
    });

    return (await response.json()) as ApiResponse<HairCatalog>;
  } catch (error) {
    console.error("Error fetching hairstyles:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load the hairstyles. Please try again.",
    };
  }
};
