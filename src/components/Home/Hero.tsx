import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen -mt-16 pt-16 flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage: `url(https://i.ibb.co/VYNrdY4T/hero-salon.jpg)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/95 via-charcoal/70 to-charcoal/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
      </div>

      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-rose/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-cream rounded-full text-sm font-medium mb-8 border border-white/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-gold" />
              Premium Salon Network
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
              <span className="text-cream block">Your Beauty,</span>
              <span
                className="block text-transparent"
                style={{
                  backgroundImage: "var(--gradient-gold)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                }}
              >
                Our Passion
              </span>
            </h1>

            <p className="text-lg md:text-xl text-cream/70 mb-10 max-w-lg leading-relaxed">
              Discover and book appointments at the finest salons.
              Experience luxury beauty services tailored just for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="xl"
                variant="gold"
                className="group relative overflow-hidden shadow-gold hover:shadow-glow transition-shadow duration-300"
                asChild
              >
                <Link href="/salons">
                  <span className="relative z-10 flex items-center gap-2">
                    Explore Salons
                    <ArrowRight className="w-5 h-5 transition-all duration-300 group-hover:translate-x-1" />
                  </span>
                  <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-cream/30 bg-cream/5 text-cream hover:bg-cream/15 hover:border-cream/50 backdrop-blur-sm"
                asChild
              >
                <Link href="/about">Learn More</Link>
              </Button>
            </div>

            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">500+</div>
                <div className="text-xs text-cream/60">Partner Salons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">50K+</div>
                <div className="text-xs text-cream/60">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">4.8★</div>
                <div className="text-xs text-cream/60">Average Rating</div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-gold rounded-2xl -rotate-12 opacity-30 pointer-events-none" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-rose/20 rounded-full blur-sm pointer-events-none" />

              <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-white/10">
                <div className="aspect-[4/3] bg-gradient-to-br from-gold/15 via-rose/10 to-sage/10 relative">
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-glow cursor-default">
                      <span className="text-white text-xl ml-1">▶</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl px-6 py-4 border-t border-white/10">
                  <p className="text-sm font-medium text-cream">
                    Luxury Salon Experience
                  </p>
                  <p className="text-xs text-cream/50">
                    Professional Video / Graphic Asset
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
