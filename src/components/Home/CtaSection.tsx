import Link from "next/link";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-white border-t border-slate-100 overflow-hidden">
      {/* Very subtle background accents */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-slate-200 shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            Join the Revolution
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-slate-900 leading-[1.1] tracking-tight mb-8">
            Ready to elevate your <br className="hidden md:block" />
            <span className="text-primary-600">beauty routine?</span>
          </h2>

          <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Join thousands of satisfied clients who have already discovered
            their perfect salon experience through our platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Button
              size="xl"
              className="w-full sm:w-auto bg-primary hover:bg-primary-600 text-white shadow-premium hover:shadow-glow transition-all duration-300 rounded-2xl h-14 px-10 font-bold text-lg"
              asChild
            >
              <Link href="/salons">Find a Salon Now</Link>
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="w-full sm:w-auto border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-primary hover:border-primary/20 hover:shadow-sm rounded-2xl h-14 px-10 font-bold text-lg transition-all duration-300"
              asChild
            >
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
