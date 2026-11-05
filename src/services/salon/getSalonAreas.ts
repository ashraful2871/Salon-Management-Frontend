import { unstable_rethrow } from "next/navigation";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, SalonArea, SalonAreasQuery } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";

/**
 * GET /salons/areas: every area with a live salon for this audience (and
 * service), with counts and where its pins are. The list pages' location
 * filter and their map framing are built from it, so a salon opening in a
 * new area shows up in the filter without anyone editing a list.
 */
export const getSalonAreas = async (
  query: SalonAreasQuery = {},
): Promise<ApiResponse<SalonArea[]>> => {
  const params = new URLSearchParams();
  if (query.audience) params.set("audience", query.audience);
  if (query.audience && query.includeUnisex === false)
    params.set("includeUnisex", "false");
  if (query.category) params.set("category", query.category);
  const qs = params.toString();

  try {
    // A handful of filter sets at most, so caching per URL is cheap. The
    // backend caches for two minutes too.
    const response = await serverFetch.get(`/salons/areas${qs ? `?${qs}` : ""}`, {
      next: { revalidate: 120, tags: [TAGS.salons] },
    });
    return (await response.json()) as ApiResponse<SalonArea[]>;
  } catch (error) {
    unstable_rethrow(error);
    console.error("getSalonAreas error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load areas. Please try again.",
    };
  }
};
