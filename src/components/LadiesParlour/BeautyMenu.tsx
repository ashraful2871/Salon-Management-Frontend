import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/Shared/Section";
import heroImg from "@/assets/hero-salon.jpg";
import { MENU } from "./content";
import { SectionHeading } from "./Heading";

/**
 * The treatments as a numbered menu, each row a link to the parlours that
 * offer it. From lg the heading and a photo stay beside the list.
 */
export default function BeautyMenu() {
  return (
    <Section labelledBy="ladies-menu">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 xl:gap-24">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            overline="The beauty menu"
            title="Everything for hair, skin and nails"
            titleId="ladies-menu"
            description="Pick a treatment to see the ladies parlours that offer it."
            className="mb-0 md:mb-0"
          />
          <div className="relative mt-10 hidden aspect-[4/3] overflow-hidden rounded-[2rem] border border-border shadow-card lg:block">
            <Image
              src={heroImg}
              alt=""
              fill
              sizes="(min-width: 1280px) 480px, 40vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
        </div>

        <ol className="border-t border-border md:grid md:grid-cols-2 md:gap-x-10 lg:block">
          {MENU.map((item, i) => (
            <li key={item.title} className="border-b border-border">
              <Link
                href={item.href}
                className="group flex items-start gap-4 rounded-sm py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-6 sm:py-6"
              >
                {/* On the title's line, however far the description wraps. */}
                <span
                  aria-hidden
                  className="w-7 shrink-0 pt-1 font-display text-sm font-semibold tabular-nums text-primary sm:pt-1.5"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary-hover sm:text-xl">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center self-center rounded-full border border-border text-foreground/70 transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
