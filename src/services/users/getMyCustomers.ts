/* eslint-disable @typescript-eslint/no-explicit-any */
import { serverFetch } from "@/lib/server-fetch";

export const getMyCustomers = async (query?: {
  page?: number;
  limit?: number;
  searchTerm?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);

    const url = `/users/my-customers${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await serverFetch.get(url);

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
