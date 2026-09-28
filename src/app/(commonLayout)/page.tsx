import { Suspense } from "react";

import Hero from "@/components/Home/Hero";
import HowItWorks from "@/components/Home/HowItWorks";
import NearbySalons from "@/components/Home/NearbySalons";
import ServiceCategories from "@/components/Home/ServiceCategories";
import TopRatedSalons, { TopRatedSkeleton } from "@/components/Home/TopRatedSalons";
import WhySalonKhuji from "@/components/Home/WhySalonKhuji";
import RecentReviews from "@/components/Home/RecentReviews";
import PartnerCtaSection from "@/components/Home/PartnerCtaSection";
import CtaSection from "@/components/Home/CtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      {/* Client-side: reads the location cookie itself so this page stays static. */}
      <NearbySalons />
      <ServiceCategories />
      <Suspense fallback={<TopRatedSkeleton />}>
        <TopRatedSalons />
      </Suspense>
      <HowItWorks />
      <WhySalonKhuji />
      {/* Renders nothing below three good reviews, so no skeleton to collapse. */}
      <Suspense fallback={null}>
        <RecentReviews />
      </Suspense>
      <PartnerCtaSection />
      <CtaSection />
    </>
  );
}
