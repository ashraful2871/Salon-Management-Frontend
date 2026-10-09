import type { ApiResponse } from "@/lib/api-types";
import { TAGS } from "@/lib/cache-tags";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type Announcement = {
  message: string;
  tone: "info" | "warning";
  href?: string;
  startsAt?: string;
  endsAt?: string;
  dismissible: boolean;
};

/** `GET /settings/public`: the platform settings marked public. */
export type PublicSettings = {
  "assistant.enabled": boolean;
  "hairTryOn.enabled": boolean;
  "signup.enabled": boolean;
  "applications.enabled": boolean;
  "content.announcement": Announcement | null;
};

/**
 * Bare `fetch`, no cookie: the same for everyone, and reading the auth cookie
 * (as `serverFetch` does) would make every public page render dynamically.
 */
export const getPublicSettings = async (): Promise<ApiResponse<PublicSettings>> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/settings/public`, {
      next: { revalidate: 60, tags: [TAGS.publicSettings] },
      // A hung API must not hold every public page; the bar just stays hidden.
      signal: AbortSignal.timeout(2500),
    });

    return (await response.json()) as ApiResponse<PublicSettings>;
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Couldn't load the site settings.",
    };
  }
};
