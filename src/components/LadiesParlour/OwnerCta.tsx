import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Section } from "@/components/Shared/Section";
import { Button } from "@/components/ui/button";
import { Overline } from "./Heading";

export default function OwnerCta() {
  return (
    <Section size="compact" labelledBy="ladies-owner-cta">
      <div className="flex flex-col items-start gap-6 rounded-[2rem] border border-gold/25 bg-primary-soft px-6 py-10 sm:px-12 sm:py-12 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="max-w-xl">
          <Overline>For parlour owners</Overline>
          <h2
            id="ladies-owner-cta"
            className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Run a ladies parlour?
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            List it for free, show your menu and prices, and take bookings
            online from customers nearby.
          </p>
        </div>
        <Button size="lg" asChild className="w-full shrink-0 shadow-gold sm:w-auto">
          <Link href="/become-salon-owner">
            List your parlour
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
