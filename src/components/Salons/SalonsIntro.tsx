import { MapPin, Navigation } from "lucide-react";

import { PublicPageHero } from "@/components/Shared/PublicPageHero";
import { locationName, type ListLocation } from "./types";

export type SalonsIntroCopy = {
  /** Leads the title once there is a place: "Salons near Mirpur". */
  noun?: string;
  /** The title when the list is not narrowed to a place. */
  title?: string;
  description?: string;
};

/**
 * The title band of a salon list page. It renders from the URL and the cookie
 * alone, so it paints before the list and stays put while a filter change
 * loads.
 */
export default function SalonsIntro({
  location,
  noun = "Salons",
  title = "Find a salon",
  description = "Compare ratings, prices and opening hours, then book your slot in a few taps.",
}: SalonsIntroCopy & { location: ListLocation }) {
  const place = locationName(location);

  const heading =
    location.kind === "near"
      ? place
        ? `${noun} near ${place}`
        : location.fromCookie
          ? `${noun} near you`
          : `${noun} near this spot`
      : location.kind === "area"
        ? `${noun} in ${location.area}`
        : place
          ? `${noun} in ${place}`
          : title;

  const overline =
    location.kind === "near"
      ? location.fromCookie
        ? "Near you"
        : "Near a pinned spot"
      : location.kind === "area"
        ? [location.area, location.district].filter(Boolean).join(", ")
        : place || "Bangladesh";

  const Icon = location.kind === "near" ? Navigation : MapPin;

  return (
    <PublicPageHero
      size="compact"
      align="left"
      overline={
        <>
          <Icon className="mr-1.5 size-3.5" aria-hidden="true" />
          {overline}
        </>
      }
      title={heading}
      description={description}
    />
  );
}
