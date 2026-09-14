import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, Store } from "lucide-react";

const PartnerCtaSection = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-white border-t border-slate-200">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-l-full blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gold/10 rounded-tr-full blur-[100px] mix-blend-multiply pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 bg-slate-50/80 backdrop-blur-2xl rounded-[3rem] p-8 md:p-14 border border-slate-200 shadow-premium">
          
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary-700 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-primary/20 shadow-sm">
              <Store className="w-4 h-4" />
              For Salon Owners
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-slate-900 leading-[1.1] tracking-tight mb-6">
              Grow your business with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 mt-2">SalonKhuji Partner</span>
            </h2>

            <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed font-medium">
              Join our exclusive network of premium salons. Get more bookings, manage your schedule effortlessly, and reach thousands of new clients every single month.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <Button
                size="xl"
                className="w-full sm:w-auto group relative overflow-hidden bg-primary hover:bg-primary-600 text-white shadow-premium hover:shadow-glow transition-all duration-300 rounded-2xl h-14 px-8 font-semibold text-base"
                asChild
              >
                <Link href="/become-salon-owner">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Business
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-sm relative hidden md:block group perspective-1000">
            <div className="aspect-square rounded-[2.5rem] bg-white p-2 shadow-premium border border-slate-200 transform transition-transform duration-700 hover:rotate-y-12 hover:rotate-x-12">
                <div className="w-full h-full rounded-[2rem] bg-slate-50 flex items-center justify-center overflow-hidden relative border border-slate-100 shadow-inner">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
                    <Store className="w-40 h-40 text-primary drop-shadow-xl group-hover:scale-110 transition-transform duration-700" />
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PartnerCtaSection;
