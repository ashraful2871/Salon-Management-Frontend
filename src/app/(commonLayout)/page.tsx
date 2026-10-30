import { Suspense } from "react";

import Hero from "@/components/Home/Hero";
import HairTryOnSection from "@/components/Home/HairTryOnSection";
import HowItWorks from "@/components/Home/HowItWorks";
import NearbySalons from "@/components/Home/NearbySalons";
import ServiceCategories from "@/components/Home/ServiceCategories";
import TopRatedSalons, {
  TopRatedSkeleton,
} from "@/components/Home/TopRatedSalons";
import WhyUs from "@/components/Home/WhyUs";
import RecentReviews from "@/components/Home/RecentReviews";
import PartnerCtaSection from "@/components/Home/PartnerCtaSection";
import CtaSection from "@/components/Home/CtaSection";
import BeautyAtHomeSection from "@/components/HomeService/BeautyAtHomeSection";

export default function Home() {
  return (
    <>
      <Hero />
      {/* Client-side: reads the location cookie itself so this page stays static. */}
      <NearbySalons />
      <ServiceCategories />
      {/* Public settings only (60 s cache): keeps / static. */}
      <BeautyAtHomeSection />
      <Suspense fallback={<TopRatedSkeleton />}>
        <TopRatedSalons />
      </Suspense>
      <HairTryOnSection />
      <HowItWorks />
      <WhyUs />
      {/* Renders nothing below three good reviews, so no skeleton to collapse. */}
      <Suspense fallback={null}>
        <RecentReviews />
      </Suspense>
      <PartnerCtaSection />
      <CtaSection />
    </>
  );
}
