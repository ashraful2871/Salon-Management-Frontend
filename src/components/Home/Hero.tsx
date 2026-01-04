import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://i.ibb.co/VYNrdY4T/hero-salon.jpg)`,
        }}
      >
        {/* Gradient Overlay - darker on left, transparent on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/80 via-[#1a1a1a]/70 to-[#1a1a1a]/20" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#62492A] text-white rounded-full text-sm font-medium mb-8">
            <span className="text-[#d4a853]">✨</span>
            Discover Premium Salons
          </span>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.1] mb-6">
            <span className="text-[#f5f0e8] block">Your Beauty,</span>
            <span className="text-[#DFC59F] block">Our Passion</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-[#f5f0e8]/80 mb-10 max-w-lg leading-relaxed">
            Discover and book appointments at the finest salons.
            <br />
            Experience luxury beauty services tailored just for you.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Primary Button - Gold */}
            <Button
              size="lg"
              className="bg-[#BD7F28] hover:bg-[#c49a48] text-white font-semibold px-8 py-6 text-base rounded-lg inline-flex items-center gap-2 transition-all duration-300"
              asChild
            >
              <Link href="/salons">
                Explore Salons
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>

            {/* Secondary Button - Outline */}
            <Button
              variant="outline"
              size="lg"
              className="border-[#f5f0e8]/40 bg-[#f5f0e8]/10 text-[#f5f0e8] hover:bg-[#f5f0e8]/20 hover:border-[#f5f0e8]/60 font-semibold px-8 py-6 text-base rounded-lg transition-all duration-300"
              asChild
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
