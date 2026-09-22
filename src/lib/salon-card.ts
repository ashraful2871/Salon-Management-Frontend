// Maps an API salon onto the fields SalonCard renders. Shared by the /salons
// list and the home "near you" strip so both cards read the same.
import type { OperatingHours, Salon } from "./api-types";
import { formatDistance } from "./geo";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop";

// JS: 0=Sun ... 6=Sat
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const timeToMinutes = (t: string) => {
  // "09:00"
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
};

export const isOpenNow = (operatingHours?: OperatingHours) => {
  if (!operatingHours) return false;

  const now = new Date();
  const today = operatingHours[DAY_KEYS[now.getDay()]];
  if (!today?.open || !today?.close) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeToMinutes(today.open);
  const closeMinutes = timeToMinutes(today.close);

  // normal same-day range (e.g., 09:00 -> 21:00)
  if (closeMinutes >= openMinutes) {
    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  }

  // overnight range (e.g., 20:00 -> 02:00)
  return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
};

// Owners paste all sorts into the image field; anything next/image can't
// load falls back to a stock photo.
export const usableImage = (src?: string | null) => {
  const img = src?.trim();
  return img &&
    img !== "null" &&
    img !== "undefined" &&
    (img.startsWith("http://") ||
      img.startsWith("https://") ||
      img.startsWith("/") ||
      img.startsWith("data:"))
    ? img
    : FALLBACK_IMAGE;
};

export const toSalonCardData = (salon: Salon) => {
  const services = (salon.services || [])
    .filter((s) => s?.isActive !== false)
    .map((s) => s.name);

  // Category/specialty: use first service category if exists, else "Salon"
  const specialty = (
    salon.services?.find((s) => s.category)?.category ?? "Salon"
  ).replaceAll("_", " ");

  const locationParts = [salon.city, salon.state].filter(Boolean);
  const location = locationParts.length
    ? locationParts.join(", ")
    : salon.address || "Unknown";

  return {
    id: salon.id,
    name: salon.name,
    rating: salon.rating ?? 0,
    reviews: salon.totalReviews ?? 0,
    specialty, // used for filter categories
    location,
    image: usableImage(salon.images?.[0]),
    services: services.length ? services : ["Service"], // keep badges visible
    openNow: isOpenNow(salon.operatingHours),
    distance:
      salon.distanceMeters != null
        ? formatDistance(
            salon.distanceMeters,
            salon.locationAccuracy === "APPROXIMATE",
          )
        : undefined,
  };
};

export type SalonCardData = ReturnType<typeof toSalonCardData>;
