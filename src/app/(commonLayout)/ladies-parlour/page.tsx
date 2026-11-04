import type { Metadata } from "next";

import SalonsListPage from "@/components/Salons/SalonsListPage";

export const metadata: Metadata = {
  title: "Ladies parlours near you",
  description:
    "Book trusted ladies parlours for haircuts, facials, keratin, threading and bridal makeup. See prices, real reviews and open times.",
};

/**
 * The salon list, ladies-only: the same page as /gents-parlour, with no unisex
 * salons and no Ladies / Gents switch. Search, area, service, near-me, map,
 * sort and pages work as on /salons and stay on this URL.
 */
export default async function LadiesParlourPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <SalonsListPage
      searchParams={await searchParams}
      audience="LADIES"
      noun={{ one: "ladies parlour", many: "ladies parlours" }}
      intro={{
        noun: "Ladies parlours",
        title: "Ladies parlours & beauty salons",
        description:
          "Haircuts, facials, keratin, threading and bridal makeup. Compare ratings and prices, then book your slot in a few taps.",
      }}
    />
  );
}
