"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { revalidateTag, updateTag } from "next/cache";
import { TAGS } from "@/lib/cache-tags";

export const deleteStaff = async (
  id: string,
  salonId?: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.delete(`/staff/${id}`, {
      method: "DELETE",
    });

    const result: ApiResponse<null> = await response.json();

    if (result.success) {
      updateTag(TAGS.mySalons);
      if (salonId) {
        // Manage salon lists staff from getSalonById: expire it now, so the
        // action's response carries the list without them.
        updateTag(TAGS.salon(salonId));
        revalidateTag(TAGS.staff(salonId), "max");
      }
    }

    return result;
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("deleteStaff error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to remove staff.",
    };
  }
};
