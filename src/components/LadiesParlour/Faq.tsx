import Link from "next/link";

import { Section } from "@/components/Shared/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FAQS } from "./content";
import { SectionHeading } from "./Heading";

export default function Faq() {
  return (
    <Section tone="subtle" labelledBy="ladies-faq">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <SectionHeading
          overline="Questions"
          title="Good to know"
          titleId="ladies-faq"
          description="Still unsure? Our support team is a message away."
          className="mb-0 md:mb-0"
        >
          <Button variant="outline" asChild className="mt-6 bg-surface">
            <Link href="/contact">Contact us</Link>
          </Button>
        </SectionHeading>

        <Accordion
          type="single"
          collapsible
          className="rounded-3xl border border-border bg-surface px-5 shadow-soft sm:px-8"
        >
          {FAQS.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q} className="border-border/70">
              <AccordionTrigger className="min-h-16 items-center font-display text-base font-semibold hover:text-primary-hover hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
