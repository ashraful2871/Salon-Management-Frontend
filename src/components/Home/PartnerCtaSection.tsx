import Link from "next/link";
import { CalendarCheck, ChartColumn, Users } from "lucide-react";

import { Button } from "../ui/button";
import { Section, SectionHeader } from "../Shared/Section";

const PERKS = [
  { icon: CalendarCheck, label: "Online bookings with live slots" },
  { icon: Users, label: "Staff, counters and today's queue" },
  { icon: ChartColumn, label: "Earnings and payouts in one place" },
] as const;

const PartnerCtaSection = () => {
  return (
    <Section
      tone="dark"
      labelledBy="owners-heading"
      containerClassName="lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-14"
    >
      <div>
        <SectionHeader
          tone="dark"
          overline="For salon owners"
          title="Fill your chairs with SalonKhuji"
          titleId="owners-heading"
          description="Take bookings with live slots, run today's queue at the counter, and see your earnings in one dashboard."
        />
        <Button size="lg" asChild className="w-full sm:w-auto">
          <Link href="/become-salon-owner">List your salon</Link>
        </Button>
      </div>
      <ul className="mt-8 grid gap-3 lg:mt-0">
        {PERKS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-light">
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="text-sm font-medium text-white">{label}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default PartnerCtaSection;
