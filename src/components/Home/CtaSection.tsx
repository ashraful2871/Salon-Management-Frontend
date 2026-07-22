import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-charcoal">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-1/4 w-48 h-48 bg-rose/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-48 h-48 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-cream rounded-full text-sm font-medium mb-8 border border-white/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-gold" />
            Join Thousands of Satisfied Customers
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-cream leading-[1.1] mb-6">
            Ready to Transform
            <span
              className="block text-transparent mt-2"
              style={{
                backgroundImage: "var(--gradient-gold)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              Your Look?
            </span>
          </h2>

          <p className="text-lg text-cream/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join thousands of satisfied customers who trust Glamour for their
            beauty needs. Book your first appointment today and experience the
            difference.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="gold"
              size="xl"
              className="group relative overflow-hidden shadow-gold hover:shadow-glow transition-shadow duration-300 px-10"
              asChild
            >
              <Link href="/register">
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
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
              <Link href="/salons">Browse Salons</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
