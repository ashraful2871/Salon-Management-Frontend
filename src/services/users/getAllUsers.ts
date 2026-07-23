import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, User } from "@/lib/api-types";

export const getAllUsers = async (query?: {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: string;
  status?: string;
}): Promise<ApiResponse<User[]>> => {
  try {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);
    if (query?.role) params.set("role", query.role);
    if (query?.status) params.set("status", query.status);

    const url = `/users${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await serverFetch.get(url, {
      next: {
        revalidate: 60,
        tags: ["users"],
      },
    });

    const result: ApiResponse<User[]> = await response.json();
    return result;
  } catch (error) {
    console.error("getAllUsers error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load users.",
    };
  }
};
