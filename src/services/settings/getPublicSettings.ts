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

/** A home search chip: a free-text search or a category filter (one of them). */
export type HomeChip = { label: string; query?: string; category?: string };

/** A home "Browse by service" tile. `icon` is a name from `lib/content-icons.ts`. */
export type CategoryTile = {
  category: string;
  labelEn: string;
  labelBn: string;
  icon: string;
  order: number;
  visible: boolean;
};

/** `content.featuredSalonIds` resolved by the API: ACTIVE, non-test salons only, in order. */
export type FeaturedSalon = {
  id: string;
  name: string;
  area: string;
  rating: number;
  totalReviews: number;
  cover: string | null;
};

/** `GET /settings/public`: the platform settings marked public. */
export type PublicSettings = {
  "assistant.enabled": boolean;
  "hairTryOn.enabled": boolean;
  "signup.enabled": boolean;
  "applications.enabled": boolean;
  /** Owner Phase 15: customers may pay the whole bill in the app (salons opt in too). */
  "booking.prepayEnabled"?: boolean;
  "content.announcement": Announcement | null;
  "content.homeChips"?: HomeChip[];
  "content.categoryTiles"?: CategoryTile[];
  featuredSalons?: FeaturedSalon[];
  // Home Service (registry group `homeService`, public keys only). Read them
  // through `homeSettingsOf`, which fills the launch defaults.
  "homeService.enabled"?: boolean;
  "homeService.ladiesEnabled"?: boolean;
  "homeService.gentsEnabled"?: boolean;
  "homeService.customerCancelPolicy"?: "FREE" | "WINDOW" | "NON_REFUNDABLE";
  "homeService.nonRefundableGraceMinutes"?: number;
  "homeService.disclaimer.free"?: string;
  "homeService.disclaimer.window"?: string;
  "homeService.disclaimer.nonRefundable"?: string;
  "homeService.lateCancelPercent"?: number;
  "homeService.noShowPercent"?: number;
  "homeService.salonCancelCreditMinor"?: number;
  "homeService.advancePercent"?: number;
  "homeService.freeCancelHours"?: number;
  "homeService.appealWindowHours"?: number;
  "homeService.bookingWindowDays"?: number;
  "homeService.minLeadMinutes"?: number;
  "homeService.rescheduleCutoffHours"?: number;
  "homeService.maxRescheduleCount"?: number;
  "homeService.ladiesLastStart"?: string;
};

type HomeServiceKey = Extract<keyof PublicSettings, `homeService.${string}`>;

/** The launch defaults (the API registry's), used when the settings call fails or a key is missing. */
export const HOME_SERVICE_DEFAULTS = {
  "homeService.enabled": true,
  "homeService.ladiesEnabled": true,
  "homeService.gentsEnabled": true,
  "homeService.customerCancelPolicy": "FREE",
  "homeService.nonRefundableGraceMinutes": 0,
  "homeService.disclaimer.free": "",
  "homeService.disclaimer.window": "",
  "homeService.disclaimer.nonRefundable": "",
  "homeService.lateCancelPercent": 0,
  "homeService.noShowPercent": 0,
  "homeService.salonCancelCreditMinor": 0,
  "homeService.advancePercent": 50,
  "homeService.freeCancelHours": 3,
  "homeService.appealWindowHours": 48,
  "homeService.bookingWindowDays": 7,
  "homeService.minLeadMinutes": 120,
  "homeService.rescheduleCutoffHours": 3,
  "homeService.maxRescheduleCount": 1,
  "homeService.ladiesLastStart": "19:30",
} as const satisfies Required<Pick<PublicSettings, HomeServiceKey>>;

export type HomeServiceSettings = { -readonly [K in HomeServiceKey]-?: NonNullable<PublicSettings[K]> };

/** Every public `homeService.*` value, the default standing in for any the API didn't send. */
export const homeSettingsOf = (settings?: Partial<PublicSettings> | null): HomeServiceSettings => {
  const out = { ...HOME_SERVICE_DEFAULTS } as HomeServiceSettings;
  for (const key of Object.keys(HOME_SERVICE_DEFAULTS) as HomeServiceKey[]) {
    const value = settings?.[key];
    if (value !== undefined && value !== null) (out as Record<string, unknown>)[key] = value;
  }
  return out;
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
