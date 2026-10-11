"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

/** `DELETE /admin/notes/:id`: the author can remove their own note within 24 h. */
export const deleteAdminNote = async (id: string): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.delete(`/admin/notes/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<null>;
  } catch (error) {
    console.error("deleteAdminNote error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't delete the note. Please try again.",
    };
  }
};
