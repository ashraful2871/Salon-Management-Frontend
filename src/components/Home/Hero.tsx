import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(https://i.ibb.co/VYNrdY4T/hero-salon.jpg)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-charcoal/20" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-dark/60 text-gold-light rounded-full text-sm font-medium mb-8 border border-gold/20">
            <span className="w-2 h-2 rounded-full bg-gold" />
            Discover Premium Salons
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
            <span className="text-cream block">Your Beauty,</span>
            <span className="text-gold block">Our Passion</span>
          </h1>
          <p className="text-lg md:text-xl text-cream/80 mb-10 max-w-lg leading-relaxed">
            Discover and book appointments at the finest salons.
            <br />
            Experience luxury beauty services tailored just for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="xl" variant="gold" className="group" asChild>
              <Link href="/salons">
                Explore Salons
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-cream/40 bg-cream/10 text-cream hover:bg-cream/20 hover:border-cream/60"
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
