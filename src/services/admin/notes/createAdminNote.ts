"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AdminNote, AdminNoteEntity } from "../types";

/** `POST /admin/notes`: adds an internal note (audited). Never shown to the customer or owner. */
export const createAdminNote = async (input: {
  entityType: AdminNoteEntity;
  entityId: string;
  body: string;
  pinned?: boolean;
}): Promise<ApiResponse<AdminNote>> => {
  try {
    const response = await serverFetch.post("/admin/notes", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    return (await response.json()) as ApiResponse<AdminNote>;
  } catch (error) {
    console.error("createAdminNote error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't save the note. Please try again.",
    };
  }
};
