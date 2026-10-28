import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OCCASIONS, ladiesList } from "./content";
import { SectionHeading } from "./Heading";

/** Bridal and occasion looks, in the brand's charcoal and gold. */
export default function Occasions() {
  return (
    <section
      aria-labelledby="ladies-occasions"
      className="bg-charcoal bg-glow-dark py-16 text-white md:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <SectionHeading
            tone="dark"
            overline="Bridal & occasions"
            title={
              <>
                Look your best on{" "}
                <span className="text-gold-light">every big day</span>
              </>
            }
            titleId="ladies-occasions"
            description="From holud to reception, find the parlour for your look. Wedding season fills up fast, so book early."
            className="mb-0 md:mb-0"
          >
            <Button size="lg" asChild className="mt-8 w-full shadow-gold sm:w-auto">
              <Link href={ladiesList("searchTerm=bridal")}>
                Find bridal parlours
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </SectionHeading>

          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {OCCASIONS.map(({ icon: Icon, title, description, href }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition-[background-color,box-shadow] hover:bg-white/10 hover:ring-gold-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light sm:p-6"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-gold/15 text-gold-light ring-1 ring-gold-light/30">
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-5 text-white/40 transition-colors group-hover:text-gold-light"
                    />
                  </span>
                  <span className="mt-5 font-display text-lg font-semibold">{title}</span>
                  <span className="mt-1 text-sm leading-snug text-white/70">{description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
