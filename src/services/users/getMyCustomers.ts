import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, User } from "@/lib/api-types";

export const getMyCustomers = async (query?: {
  page?: number;
  limit?: number;
  searchTerm?: string;
}): Promise<ApiResponse<User[]>> => {
  try {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);

    const url = `/users/my-customers${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await serverFetch.get(url, {
      next: {
        revalidate: 60,
        tags: ["my-customers"],
      },
    });

    const result: ApiResponse<User[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getMyCustomers error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load customers.",
    };
  }
};
