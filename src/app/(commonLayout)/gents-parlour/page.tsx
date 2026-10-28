import type { Metadata } from "next";

import SalonsListPage from "@/components/Salons/SalonsListPage";

export const metadata: Metadata = {
  title: "Gents parlours & barbers near you",
  description:
    "Book gents parlours and barbers for haircuts, beard trims, shaves and facials. See prices, real reviews and open times.",
};

/**
 * The salon list, gents-only: no unisex salons and no Ladies / Gents switch.
 * Search, area, service, near-me, map, sort and pages work as on /salons and
 * stay on this URL.
 */
export default async function GentsParlourPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <SalonsListPage
      searchParams={await searchParams}
      audience="GENTS"
      noun={{ one: "gents parlour", many: "gents parlours" }}
      intro={{
        noun: "Gents parlours",
        title: "Gents parlours & barbers",
        description:
          "Haircuts, fades, beard trims and hot towel shaves. Compare ratings and prices, then book your slot in a few taps.",
      }}
    />
  );
}
