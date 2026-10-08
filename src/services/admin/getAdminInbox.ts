import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";
import type { AdminInboxItem } from "./types";

/**
 * `GET /admin/inbox`: the open work the caller's permissions cover, for the
 * top-bar bell and Home's "Needs attention". Cached 30 s; a mutation that
 * closes an item calls `updateTag(TAGS.adminInbox)`.
 */
export const getAdminInbox = async (): Promise<ApiResponse<AdminInboxItem[]>> => {
  try {
    const response = await serverFetch.get("/admin/inbox", {
      next: { revalidate: 30, tags: [TAGS.adminInbox] },
    });
    return (await response.json()) as ApiResponse<AdminInboxItem[]>;
  } catch (error) {
    console.error("getAdminInbox error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to load what needs attention.",
    };
  }
};
