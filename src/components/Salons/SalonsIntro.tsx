import { MapPin } from "lucide-react";

import { PublicPageHero } from "@/components/Shared/PublicPageHero";

export type SalonsIntroCopy = {
  /** Leads the title once there is a point: "Salons near Mirpur". */
  noun?: string;
  /** The title when there is no point to measure from. */
  title?: string;
  description?: string;
};

/**
 * The title band of a salon list page. It renders from the URL and the cookie
 * alone, so it paints before the list and stays put while a filter change
 * loads.
 */
export default function SalonsIntro({
  point,
  noun = "Salons",
  title = "Find a salon",
  description = "Compare ratings, prices and opening hours, then book your slot in a few taps.",
}: SalonsIntroCopy & {
  point: { label?: string } | null;
}) {
  const place = point?.label?.split(",")[0];

  return (
    <PublicPageHero
      size="compact"
      align="left"
      overline={
        <>
          <MapPin className="mr-1.5 size-3.5" aria-hidden="true" />
          {point ? "Near you" : "Bangladesh"}
        </>
      }
      title={
        place
          ? `${noun} near ${place}`
          : point
            ? `${noun} near you`
            : title
      }
      description={description}
    />
  );
}
