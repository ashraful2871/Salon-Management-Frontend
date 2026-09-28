import Link from "next/link";

import { Button } from "../ui/button";
import { Section } from "../Shared/Section";

const CtaSection = () => {
  return (
    <Section size="compact" labelledBy="final-cta-heading">
      <div className="rounded-3xl border border-border bg-primary-soft px-6 py-10 text-center sm:px-10 sm:py-14">
        <h2
          id="final-cta-heading"
          className="font-display text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl"
        >
          Your next appointment is a few taps away
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
          Find a salon near you, or let AI Match suggest one.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/salons">Find a salon</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/ai-suggestions">Try AI Match</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
};

export default CtaSection;
