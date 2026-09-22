"use server";

import { cookies, headers } from "next/headers";
import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse, OperatingHours } from "@/lib/api-types";
import { LOCATION_COOKIE, parseSavedLocation } from "@/lib/location-cookie";

export type AiSalonService = {
  id: string;
  name: string;
  category: string;
  /** Poisha. `formatBDT` takes this, not the `price` taka twin. */
  priceMinor: number;
  duration: number;
};

/**
 * "best" meets everything the search asked for, "partial" some of it, and
 * "alternative" is shown only when nothing matched at all.
 */
export type AiMatchType = "best" | "partial" | "alternative";

export type AiReason = {
  kind: "name" | "service" | "place" | "distance" | "price" | "rating" | "open";
  text: string;
};

export type AiSalonMatch = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  area: string;
  district: string;
  city: string;
  images: string[];
  rating: number;
  totalReviews: number;
  phone: string;
  operatingHours?: OperatingHours | null;
  locationAccuracy?: "EXACT" | "APPROXIMATE" | null;
  /** Metres from the customer's saved location or the place they named. */
  distanceMeters: number | null;
  /** Raw cosine similarity. Not a percentage - compare within one search only. */
  similarity: number | null;
  score: number;
  matchType: AiMatchType;
  /** Open right now in Dhaka; null when the salon has not listed its hours. */
  openNow: boolean | null;
  services: AiSalonService[];
  /** The services that answer the search, the best example first. */
  matchedServices: AiSalonService[];
  /** Why it is here ("Classic Haircut · ৳120", "In Dhanmondi"). */
  reasons: AiReason[];
  /** What it does not meet ("No haircut listed"). */
  missing: AiReason[];
};

export type AiSearchIntent = {
  categories: Array<{ value: string; label: string }>;
  serviceTerms: string[];
  place: string | null;
  otherPlace: string | null;
  nearMe: boolean;
  maxPriceMinor: number | null;
  minPriceMinor: number | null;
  budget: boolean;
  minRating: number | null;
  sortBy: "relevance" | "rating" | "price" | "distance";
  openNow: boolean;
  understoodBy: "rules" | "rules+ai";
};

export type AiSearchData = {
  query: string;
  aiResponse: string;
  salons: AiSalonMatch[];
  intent?: AiSearchIntent;
  /** Parts of the request no salon could meet, in plain words. */
  notes?: string[];
  /** Asked for "near me" without a saved location. */
  needsLocation?: boolean;
  location?: {
    used: boolean;
    label: string | null;
    source: "user" | "place" | null;
  };
};

/**
 * The visitor's address as Vercel saw it. Sent to the API with the shared
 * INTERNAL_API_KEY so its rate limiter counts visitors, not this server.
 */
const clientIpHeaders = async (): Promise<Record<string, string>> => {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) return {};

  const incoming = await headers();
  const ip =
    incoming.get("x-real-ip")?.trim() ||
    incoming.get("x-forwarded-for")?.split(",")[0]?.trim();

  return ip ? { "X-Client-IP": ip, "X-Internal-Key": internalKey } : {};
};

export const searchAiSuggestions = async (
  prompt: string,
): Promise<ApiResponse<AiSearchData>> => {
  try {
    // The location the customer picked in the navbar chip, if any. Rounded to
    // ~110 m when it was saved; never stored by the API.
    const saved = parseSavedLocation(
      (await cookies()).get(LOCATION_COOKIE)?.value,
    );

    const response = await serverFetch.post("/ai/search", {
      headers: {
        "Content-Type": "application/json",
        ...(await clientIpHeaders()),
      },
      body: JSON.stringify({
        prompt,
        ...(saved
          ? { lat: saved.lat, lng: saved.lng, locationLabel: saved.label }
          : {}),
      }),
      // Results depend on the moment (open now) and the location.
      cache: "no-store",
    });

    return (await response.json()) as ApiResponse<AiSearchData>;
  } catch (error) {
    console.error("Error in AI search:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Something went wrong while fetching AI suggestions.",
    };
  }
};
