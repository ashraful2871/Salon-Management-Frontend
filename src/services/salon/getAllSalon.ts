import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, Salon, SalonQuery } from "@/lib/api-types";

export const getAllSalon = async (
  query?: SalonQuery,
): Promise<ApiResponse<Salon[]>> => {
  const params = new URLSearchParams();
  if (query?.division) params.set("division", query.division);
  if (query?.district) params.set("district", query.district);
  if (query?.area) params.set("area", query.area);
  if (query?.searchTerm) params.set("searchTerm", query.searchTerm);
  if (query?.city) params.set("city", query.city);

  const nearby = query?.lat != null && query?.lng != null;
  if (nearby) {
    params.set("lat", String(query.lat));
    params.set("lng", String(query.lng));
    if (query.radiusKm != null) params.set("radiusKm", String(query.radiusKm));
  }
  if (query?.sort) params.set("sort", query.sort);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));

  const url = `/salons${params.toString() ? `?${params.toString()}` : ""}`;

  try {
    // Coordinates in the URL would make one cache entry per point.
    const response = await serverFetch.get(
      url,
      nearby
        ? { cache: "no-store" }
        : {
            next: {
              revalidate: 60,
              tags: ["salons"],
            },
          },
    );

    const result: ApiResponse<Salon[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getAllSalon error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load salons. Please try again.",
    };
  }
};
