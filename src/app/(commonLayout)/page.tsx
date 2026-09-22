import BentoBox from "@/components/Home/BentoBox";
import Hero from "@/components/Home/Hero";
import NearbySalons from "@/components/Home/NearbySalons";
import Testimonials from "@/components/Home/Testimonials";
import PartnerCtaSection from "@/components/Home/PartnerCtaSection";
import CtaSection from "@/components/Home/CtaSection";
import Marquee from "@/components/Home/Marquee";

export default function Home() {
  return (
    <>
      <Hero />
      {/* Client-side: reads the location cookie itself so this page stays static. */}
      <NearbySalons />
      <Marquee />
      <BentoBox />
      <Testimonials />
      <PartnerCtaSection />
      <CtaSection />
    </>
  );
}
