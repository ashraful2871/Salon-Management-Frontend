"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import type { AdminNote, AdminNoteEntity } from "../types";

/** `GET /admin/notes`: one entity's internal notes, pinned first. Read by `NotesPanel` on open. */
export const getAdminNotes = async (
  entityType: AdminNoteEntity,
  entityId: string,
): Promise<ApiResponse<AdminNote[]>> => {
  try {
    const query = new URLSearchParams({ entityType, entityId });
    const response = await serverFetch.get(`/admin/notes?${query}`, { cache: "no-store" });
    return (await response.json()) as ApiResponse<AdminNote[]>;
  } catch (error) {
    console.error("getAdminNotes error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load notes.",
    };
  }
};
