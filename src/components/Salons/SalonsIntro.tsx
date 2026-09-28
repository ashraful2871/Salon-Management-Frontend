import { MapPin } from "lucide-react";

import { PublicPageHero } from "@/components/Shared/PublicPageHero";

/**
 * The /salons title band. It renders from the URL and the cookie alone, so it
 * paints before the list and stays put while a filter change loads.
 */
export default function SalonsIntro({
  point,
}: {
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
          ? `Salons near ${place}`
          : point
            ? "Salons near you"
            : "Find a salon"
      }
      description="Compare ratings, prices and opening hours, then book your slot in a few taps."
    />
  );
}
