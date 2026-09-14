import Hero from "@/components/Home/Hero";
import BentoBox from "@/components/Home/BentoBox";
import Testimonials from "@/components/Home/Testimonials";
import CtaSection from "@/components/Home/CtaSection";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <BentoBox />
      <Testimonials />
      <CtaSection />
    </div>
  );
}
