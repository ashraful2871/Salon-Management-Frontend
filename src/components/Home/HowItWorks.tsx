import Link from "next/link";
import { CalendarClock, Search, Ticket } from "lucide-react";

import { Button } from "../ui/button";
import { IconTile } from "../Shared/FeatureCard";
import { Section, SectionHeader } from "../Shared/Section";
import { NEARBY_RADIUS_KM } from "@/lib/geo";

const STEPS = [
  {
    icon: Search,
    title: "Find a salon",
    body: `Search by service or area, or see what's within ${NEARBY_RADIUS_KM} km of you.`,
  },
  {
    icon: CalendarClock,
    title: "Pick a time",
    body: "See real open slots and prices before you book.",
  },
  {
    icon: Ticket,
    title: "Pay and get your token",
    body: "Pay from your SalonKhuji wallet and show your booking token at the salon.",
  },
];

// The hero's "How it works" link lands here (#how-it-works).
export default function HowItWorks() {
  return (
    <Section id="how-it-works" labelledBy="how-heading">
      <SectionHeader
        align="center"
        overline="How it works"
        title="Book in three steps"
        titleId="how-heading"
      />
      <ol className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground tabular-nums">
                {i + 1}
              </span>
              <IconTile icon={step.icon} />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-1 text-base leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex justify-center">
        <Button size="lg" asChild className="w-full sm:w-auto">
          <Link href="/salons">Find a salon</Link>
        </Button>
      </div>
    </Section>
  );
}
