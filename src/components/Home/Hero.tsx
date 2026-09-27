import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Star, CalendarCheck } from "lucide-react";
import NearMeButton from "./NearMeButton";
import heroImg from "@/assets/hero-salon.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[88svh] lg:min-h-[95vh] -mt-16 pt-24 pb-16 flex items-center overflow-hidden bg-cream-50 bg-glow-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">

          {/* Left Text Content. No entrance fade: the LCP element is in here. */}
          <div className="flex-1 text-center lg:text-left pt-10 lg:pt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-full text-xs font-bold tracking-wide mb-8 border border-border shadow-card">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Elevate Your Beauty Experience
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-black font-display leading-[1.05] tracking-tight mb-8">
              <span className="text-slate-900 block drop-shadow-sm">Discover Your</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary to-gold mt-2">
                Perfect Look.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Book top-rated salons, manage your appointments seamlessly, and experience luxury beauty services tailored specifically for you.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center lg:justify-start gap-5">
              <Button
                size="xl"
                className="w-full sm:w-auto group relative overflow-hidden bg-primary hover:bg-primary-600 text-white shadow-premium hover:shadow-glow transition-all duration-300 rounded-2xl h-14 px-8 font-semibold text-base"
                asChild
              >
                <Link href="/salons">
                  <span className="relative z-10 flex items-center gap-2">
                    Book Appointment
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>
              <NearMeButton className="w-full sm:w-auto border-primary/30 bg-white text-slate-800 hover:text-primary hover:border-primary/40 hover:shadow-sm rounded-2xl h-14 px-8 font-semibold text-base transition-all duration-300" />
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto border-slate-200 bg-white text-slate-700 hover:text-primary hover:border-primary/20 hover:shadow-sm rounded-2xl h-14 px-8 font-semibold text-base transition-all duration-300"
                asChild
              >
                <Link href="/about">How it works</Link>
              </Button>
            </div>
          </div>

          {/* Right Visual Content */}
          <div className="flex-1 w-full relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-[550px] mx-auto">

              {/* Main Image Plate */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-white p-3 shadow-card border border-border rotate-2">
                <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-slate-100 shadow-inner">
                  {/* Desktop only (the column is hidden below lg), so no preload. */}
                  <Image
                    src={heroImg}
                    alt="Luxury Salon"
                    fill
                    sizes="(min-width: 1024px) 550px, 0px"
                    placeholder="blur"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />
                </div>
              </div>

              {/* Floating Element 1: Appointment */}
              <div className="absolute -left-12 top-1/4 bg-white border border-border rounded-2xl p-4 shadow-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-slate-900 font-bold font-display text-lg">Confirmed</div>
                  <div className="text-slate-500 text-sm font-medium">Today, 2:30 PM</div>
                </div>
              </div>

              {/* Floating Element 2: Rating */}
              <div className="absolute -right-8 bottom-1/3 bg-white border border-border rounded-2xl p-4 shadow-card flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900 font-display">4.9</span>
                  <Star className="w-5 h-5 text-gold fill-gold" />
                </div>
                <div className="text-slate-500 text-sm font-medium">Top Rated Salon</div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
