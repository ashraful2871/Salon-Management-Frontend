import { Suspense } from "react";

import { LadiesAtHomeBand } from "@/components/HomeService/BeautyAtHomeSection";
import BeautyMenu from "./BeautyMenu";
import Faq from "./Faq";
import Hero from "./Hero";
import Occasions from "./Occasions";
import OwnerCta from "./OwnerCta";
import Promises from "./Promises";
import Reviews from "./Reviews";
import TopParlours, { TopParloursSkeleton } from "./TopParlours";

/**
 * /ladies-parlour, in the brand's ivory, gold and charcoal. The parlours,
 * their photos, the count and the reviews are live (ladies-only salons, best
 * rated first); everything else is static copy from ./content.
 */
export default function LadiesParlourPage() {
  return (
    <>
      <Hero />
      <Promises />
      <BeautyMenu />
      <Suspense fallback={<TopParloursSkeleton />}>
        <TopParlours />
      </Suspense>
      <Occasions />
      <LadiesAtHomeBand />
      {/* Renders nothing below three good reviews, so no skeleton to collapse. */}
      <Suspense fallback={null}>
        <Reviews />
      </Suspense>
      <Faq />
      <OwnerCta />
    </>
  );
}
