import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Star, CalendarCheck } from "lucide-react";
import NearMeButton from "./NearMeButton";

const Hero = () => {
  return (
    <section className="relative min-h-[95vh] -mt-16 pt-24 pb-16 flex items-center overflow-hidden bg-slate-50">
      {/* Dynamic Mesh Gradients (Light Mode Variations) */}
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] mix-blend-multiply pointer-events-none animate-pulse duration-10000" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gold/15 rounded-full blur-[100px] mix-blend-multiply pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-rose/10 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          
          {/* Left Text Content */}
          <div className="flex-1 text-center lg:text-left pt-10 lg:pt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 text-primary-700 rounded-full text-xs font-bold tracking-wide mb-8 border border-primary/20 backdrop-blur-xl shadow-sm animate-slide-up">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Elevate Your Beauty Experience
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-black font-display leading-[1.05] tracking-tight mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <span className="text-slate-900 block drop-shadow-sm">Discover Your</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary to-gold mt-2">
                Perfect Look.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium animate-slide-up" style={{ animationDelay: '200ms' }}>
              Book top-rated salons, manage your appointments seamlessly, and experience luxury beauty services tailored specifically for you.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center lg:justify-start gap-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
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
              <NearMeButton className="w-full sm:w-auto border-primary/30 bg-white/70 text-slate-800 hover:bg-white hover:text-primary hover:border-primary/40 hover:shadow-sm backdrop-blur-md rounded-2xl h-14 px-8 font-semibold text-base transition-all duration-300" />
              <Button
                variant="outline"
                size="xl"
                className="w-full sm:w-auto border-slate-200 bg-white/50 text-slate-700 hover:bg-white hover:text-primary hover:border-primary/20 hover:shadow-sm backdrop-blur-md rounded-2xl h-14 px-8 font-semibold text-base transition-all duration-300"
                asChild
              >
                <Link href="/about">How it works</Link>
              </Button>
            </div>
            
            <div className="mt-14 flex items-center justify-center lg:justify-start gap-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={`User ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-gold mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-slate-500 font-medium">Over <strong className="text-slate-900">50,000+</strong> happy clients</span>
              </div>
            </div>
          </div>

          {/* Right Visual Content */}
          <div className="flex-1 w-full relative hidden lg:block animate-scale-in" style={{ animationDelay: '200ms' }}>
            <div className="relative w-full aspect-square max-w-[550px] mx-auto">
              
              {/* Main Image Plate */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-white/40 p-3 backdrop-blur-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-white/80 rotate-3 transition-transform duration-700 hover:rotate-0">
                <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-slate-100 shadow-inner">
                  <img src="https://i.ibb.co/VYNrdY4T/hero-salon.jpg" alt="Luxury Salon" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />
                </div>
              </div>

              {/* Floating Element 1: Appointment */}
              <div className="absolute -left-12 top-1/4 bg-white/90 backdrop-blur-2xl border border-slate-100 rounded-2xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-slate-900 font-bold font-display text-lg">Confirmed</div>
                  <div className="text-slate-500 text-sm font-medium">Today, 2:30 PM</div>
                </div>
              </div>

              {/* Floating Element 2: Rating */}
              <div className="absolute -right-8 bottom-1/3 bg-white/90 backdrop-blur-2xl border border-slate-100 rounded-2xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col gap-2 animate-bounce-slow" style={{ animationDelay: '-2s' }}>
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
