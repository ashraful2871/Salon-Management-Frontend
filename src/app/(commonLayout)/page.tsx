import BentoBox from "@/components/Home/BentoBox";
import Hero from "@/components/Home/Hero";
import Testimonials from "@/components/Home/Testimonials";
import PartnerCtaSection from "@/components/Home/PartnerCtaSection";
import CtaSection from "@/components/Home/CtaSection";
import Marquee from "@/components/Home/Marquee";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <BentoBox />
      <Testimonials />
      <PartnerCtaSection />
      <CtaSection />
    </>
  );
}
