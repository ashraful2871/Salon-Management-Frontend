import Hero from "@/components/Home/Hero";
import Features from "@/components/Home/Features";
import Services from "@/components/Home/Services";
import Testimonials from "@/components/Home/Testimonials";
import CtaSection from "@/components/Home/CtaSection";
import Stats from "@/components/Home/Stats";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Services />
      <Testimonials />
      <CtaSection />
      <Stats />
    </div>
  );
}
