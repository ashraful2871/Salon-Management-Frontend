"use client";
import Hero from "@/components/Home/Hero";
import Features from "@/components/Home/Features";
import Services from "@/components/Home/Services";
import CtaSection from "@/components/Home/CtaSection";
import Stats from "@/components/Home/Stats";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}

      <Features />
      {/* Services Section */}
      <Services />

      {/* CTA Section */}
      <CtaSection />

      {/* Stats Section */}
      <Stats />
    </div>
  );
}
