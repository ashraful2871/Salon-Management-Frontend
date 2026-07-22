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

  const url = `/salons${params.toString() ? `?${params.toString()}` : ""}`;

  try {
    const response = await serverFetch.get(url, {
      next: {
        revalidate: 60,
        tags: ["salons"],
      },
    });

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
