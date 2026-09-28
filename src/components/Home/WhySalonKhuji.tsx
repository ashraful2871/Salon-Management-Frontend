import Link from "next/link";
import { CalendarClock, ShieldCheck, Sparkles, Ticket, Wallet } from "lucide-react";

import { Button } from "../ui/button";
import { FeatureCard, IconTile } from "../Shared/FeatureCard";
import { Section, SectionHeader } from "../Shared/Section";

// Every claim here is something the product does today; add one only when it ships.
const REASONS = [
  {
    icon: ShieldCheck,
    title: "Approved salons",
    description: "Every salon is checked by our team before it goes live.",
  },
  {
    icon: CalendarClock,
    title: "Real open slots",
    description: "What you see is what's free. No calls to find a time.",
  },
  {
    icon: Wallet,
    title: "One wallet",
    description: "Top up once and pay for bookings in a tap.",
  },
  {
    icon: Ticket,
    title: "A token, not a queue",
    description: "Get a booking token and check in at the counter when you arrive.",
  },
] as const;

export default function WhySalonKhuji() {
  return (
    <Section tone="subtle" labelledBy="why-heading">
      <SectionHeader
        overline="Why SalonKhuji"
        title="Booking a salon, without the phone calls"
        titleId="why-heading"
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {REASONS.map((reason) => (
          <li key={reason.title}>
            <FeatureCard
              icon={reason.icon}
              title={reason.title}
              description={reason.description}
            />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-8 md:flex-row md:items-center md:justify-between lg:mt-6">
        <div className="flex items-start gap-4">
          <IconTile icon={Sparkles} />
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Not sure what you need?
            </h3>
            <p className="mt-1 text-base leading-relaxed text-muted-foreground">
              Describe it in your own words and AI Match suggests salons and
              services that fit.
            </p>
          </div>
        </div>
        <Button variant="outline" size="lg" asChild className="w-full md:w-auto">
          <Link href="/ai-suggestions">Try AI Match</Link>
        </Button>
      </div>
    </Section>
  );
}
