/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverFetch } from "@/lib/server-fetch";

export const getAllSalon = async (query?: { division?: string; district?: string; area?: string; searchTerm?: string; city?: string }) => {
  const params = new URLSearchParams();
  if (query?.division) params.set("division", query.division);
  if (query?.district) params.set("district", query.district);
  if (query?.area) params.set("area", query.area);
  if (query?.searchTerm) params.set("searchTerm", query.searchTerm);
  if (query?.city) params.set("city", query.city);
  
  const url = `/salons${params.toString() ? `?${params.toString()}` : ""}`;
  
  try {
    const response = await serverFetch.get(url, {
      next: { tags: ["salons"] },
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      message: `${
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong"
      }`,
    };
  }
};
