import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="py-20 bg-[#322B22]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
          Ready to Transform Your Look?
        </h2>
        <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
          Join thousands of satisfied customers who trust Glamour for their
          beauty needs. Book your first appointment today.
        </p>
        <Button variant="gold" size="xl" asChild>
          <Link href="/salons">
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default CtaSection;
