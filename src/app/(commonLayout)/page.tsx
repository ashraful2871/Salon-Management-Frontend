"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Hero from "@/components/Home/Hero";
import Features from "@/components/Home/Features";
import Services from "@/components/Home/Services";
import CtaSection from "@/components/Home/CtaSection";
import Stats from "@/components/Home/Stats";

export default function HomePage() {
  const services = [
    {
      name: "Haircut & Styling",
      description: "Professional haircuts and styling for all hair types",
      image: "💇",
    },
    {
      name: "Hair Coloring",
      description: "Expert hair coloring and highlights services",
      image: "🎨",
    },
    {
      name: "Facial & Skincare",
      description: "Rejuvenating facials and skincare treatments",
      image: "✨",
    },
    {
      name: "Manicure & Pedicure",
      description: "Complete nail care and beautiful nail art",
      image: "💅",
    },
    {
      name: "Massage Therapy",
      description: "Relaxing massage and wellness treatments",
      image: "💆",
    },
    {
      name: "Makeup Services",
      description: "Professional makeup for all occasions",
      image: "💄",
    },
  ];

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
