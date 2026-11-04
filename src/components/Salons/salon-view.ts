/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Salon } from "@/lib/api-types";

/**
 * The part of `GET /salons/:id` the public salon page and its booking flow
 * render. Built on the server, so the owner's business record (KYC, tax ids,
 * payout flags) that rides along on the API answer never reaches the browser.
 */

export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type OperatingHours = Partial<Record<DayKey, { open: string; close: string }>>;

export type SalonServiceView = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priceMinor: number | null;
  duration: number | null;
};

export type SalonStaffView = {
  id: string;
  name: string;
  speciality: string | null;
  photo: string | null;
  rating: number;
  totalReviews: number;
  experience: number | null;
};

export type SalonReviewView = {
  id: string;
  rating: number;
  comment: string | null;
  ownerReply: string | null;
  createdAt: string | null;
  customerId: string | null;
  customerName: string;
};

export type SalonClosureView = NonNullable<Salon["upcomingClosures"]>[number];

export type SalonView = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  address: string | null;
  area: string | null;
  district: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: Salon["locationAccuracy"];
  audience: "UNISEX" | "LADIES" | "GENTS";
  rating: number;
  totalReviews: number;
  operatingHours: OperatingHours;
  services: SalonServiceView[];
  staff: SalonStaffView[];
  reviews: SalonReviewView[];
  counters: { id: string; name: string; code: string | null }[];
  bookingPaused: boolean;
  /** Minutes before the start a held deposit can still be released. */
  cancellationWindowMin: number;
  closures: SalonClosureView[];
  /** Sides bookable at home; null when the branch does not come to homes. */
  homeService: { ladies: boolean; gents: boolean } | null;
  /** The owner's user id, only to decide who may report a review. */
  ownerUserId: string | null;
};

export const isImageUrl = (url: unknown): url is string => {
  if (typeof url !== "string") return false;
  const u = url.trim();
  return (
    u !== "" &&
    u !== "null" &&
    u !== "undefined" &&
    (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/") || u.startsWith("data:"))
  );
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function toSalonView(raw: any): SalonView {
  const home = raw?.homeService;
  return {
    id: raw.id,
    name: raw.name ?? "Salon",
    description: str(raw.description),
    images: (Array.isArray(raw.images) ? raw.images : []).filter(isImageUrl),
    address: str(raw.address),
    area: str(raw.area),
    district: str(raw.district),
    city: str(raw.city),
    phone: str(raw.phone),
    website: str(raw.website),
    latitude: num(raw.latitude),
    longitude: num(raw.longitude),
    locationAccuracy: raw.locationAccuracy ?? null,
    audience: raw.audience === "LADIES" || raw.audience === "GENTS" ? raw.audience : "UNISEX",
    rating: num(raw.rating) ?? 0,
    totalReviews: num(raw.totalReviews) ?? 0,
    operatingHours: raw.operatingHours && typeof raw.operatingHours === "object" ? raw.operatingHours : {},
    services: (raw.services ?? [])
      .filter((s: any) => s?.isActive && !s?.isDeleted)
      .map((s: any) => ({
        id: s.id,
        name: s.name ?? "Service",
        description: str(s.description),
        category: str(s.category) ?? "OTHER",
        priceMinor: num(s.priceMinor),
        duration: num(s.duration),
      })),
    staff: (raw.staff ?? [])
      .filter((m: any) => !m?.isDeleted)
      .map((m: any) => ({
        id: m.id,
        name: str(m.user?.name) ?? "Specialist",
        speciality: str(m.speciality),
        photo: isImageUrl(m.user?.profilePhoto) ? m.user.profilePhoto : null,
        rating: num(m.rating) ?? 0,
        totalReviews: num(m.totalReviews) ?? 0,
        experience: num(m.experience),
      })),
    reviews: (raw.reviews ?? []).map((r: any, i: number) => ({
      id: r.id ?? `review-${i}`,
      rating: num(r.rating) ?? 0,
      comment: str(r.comment),
      ownerReply: str(r.ownerReply),
      createdAt: str(r.createdAt),
      customerId: r.customer?.id ?? null,
      customerName: str(r.customer?.name) ?? str(r.user?.name) ?? "Customer",
    })),
    counters: (raw.counters ?? [])
      .filter((c: any) => c?.isActive !== false && !c?.isDeleted)
      .map((c: any) => ({ id: c.id, name: c.name ?? "Counter", code: str(c.code) })),
    bookingPaused: Boolean(raw.bookingPaused),
    cancellationWindowMin: num(raw.cancellationWindowMin) ?? 120,
    closures: Array.isArray(raw.upcomingClosures) ? raw.upcomingClosures : [],
    homeService: home && (home.ladies || home.gents) ? { ladies: !!home.ladies, gents: !!home.gents } : null,
    ownerUserId: raw.owner?.userId ?? null,
  };
}

/** "Shop 3, Avenue 02" + "Banasree" + "Dhaka", skipping parts already said. */
export function addressLine(s: Pick<SalonView, "address" | "area" | "district" | "city">) {
  const parts: string[] = [];
  for (const part of [s.address, s.area, s.district || s.city]) {
    if (!part) continue;
    if (parts.some((p) => p.toLowerCase().includes(part.toLowerCase()))) continue;
    parts.push(part);
  }
  return parts.join(", ");
}

export const AUDIENCE_LABEL: Record<SalonView["audience"], string> = {
  UNISEX: "Unisex",
  LADIES: "Ladies",
  GENTS: "Gents",
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

export type BookingQuery = {
  service?: string;
  staff?: string;
  date?: string;
  notes?: string;
  step?: "service" | "time";
  /** Opens the flow on "At home". */
  mode?: "home";
};

/** The booking flow (`/salons/:id/book`); with a slot it is the review page instead. */
export const bookingHref = (salonId: string, q: BookingQuery = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v) p.set(k, v);
  const s = p.toString();
  return `/salons/${salonId}/book${s ? `?${s}` : ""}`;
};

/** 180 -> "3 hours", 90 -> "90 minutes". */
export const windowText = (min: number) =>
  min % 60 === 0 ? `${min / 60} hour${min === 60 ? "" : "s"}` : `${min} minutes`;

export const durationText = (min: number | null) => {
  if (!min) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};
