import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, CalendarClock, Check, MapPin, Tag } from "lucide-react";

import heroImg from "@/assets/hero-salon.jpg";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/Shared/FeatureCard";
import { PublicPageHero } from "@/components/Shared/PublicPageHero";
import { Section, SectionHeader } from "@/components/Shared/Section";

const HOW_IT_WORKS = [
  {
    title: "For customers",
    steps: [
      "Search or share your location",
      "Pick a service and an open slot",
      "Pay from your wallet and show your token",
    ],
  },
  {
    title: "For salons",
    steps: [
      "Apply and get approved",
      "Add services, staff and hours",
      "Take bookings and track earnings",
    ],
  },
];

const VALUES = [
  {
    icon: BadgeCheck,
    title: "Checked salons",
    description: "Every salon is reviewed before it goes live.",
  },
  {
    icon: Tag,
    title: "Clear prices",
    description: "You see the price in taka before you book.",
  },
  {
    icon: CalendarClock,
    title: "Real availability",
    description: "Slots come from the salon's own schedule.",
  },
  {
    icon: MapPin,
    title: "Built for Bangladesh",
    description: "The areas you know, and prices in taka.",
  },
];

// PLACEHOLDER names and roles, kept on the owner's request (2026-09-28):
// replace them with the real team, or delete this array and the team
// section, before launch.
const TEAM = [
  { name: "Sarah Chen", role: "CEO & Founder" },
  { name: "Michael Rodriguez", role: "CTO" },
  { name: "Emily Johnson", role: "Head of Operations" },
  { name: "David Kim", role: "Head of Partnerships" },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function About() {
  return (
    <>
      <PublicPageHero
        overline="About SalonKhuji"
        title="Making salon booking simple in Bangladesh"
        description="Find a salon near you, see real prices and open slots, and book without a phone call. For salons, one place to take bookings and run the day."
        actions={
          <>
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/salons">Find a salon</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="/become-salon-owner">List your salon</Link>
            </Button>
          </>
        }
      />

      <Section
        labelledBy="why-heading"
        containerClassName="lg:grid lg:grid-cols-2 lg:items-center lg:gap-14"
      >
        <div>
          <SectionHeader title="Why we built it" titleId="why-heading" />
          <div className="max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              Booking a salon usually means calling around and hoping
              there&apos;s a free chair when you arrive. SalonKhuji shows
              what&apos;s open, what it costs and how far it is, before you
              leave home.
            </p>
            <p>
              Salons get one place to list their services, set their hours
              and staff, and take bookings without the phone ringing all day.
            </p>
          </div>
        </div>
        <Image
          src={heroImg}
          alt="Inside a salon"
          placeholder="blur"
          sizes="(min-width:1024px) 50vw, 100vw"
          className="mt-8 aspect-[4/3] w-full rounded-3xl object-cover lg:mt-0"
        />
      </Section>

      <Section tone="subtle" labelledBy="about-how-heading">
        <SectionHeader
          overline="How it works"
          title="Simple on both sides"
          titleId="about-how-heading"
        />
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {HOW_IT_WORKS.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
            >
              <h3 className="font-display text-lg font-semibold text-foreground">
                {group.title}
              </h3>
              <ol className="mt-4 space-y-3">
                {group.steps.map((step) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-base text-muted-foreground"
                  >
                    <Check
                      aria-hidden
                      className="mt-0.5 size-5 shrink-0 text-success"
                    />
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section labelledBy="values-heading">
        <SectionHeader
          overline="Our principles"
          title="What we care about"
          titleId="values-heading"
        />
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {VALUES.map((value) => (
            <FeatureCard key={value.title} {...value} />
          ))}
        </div>
        <p id="privacy-analytics" className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          How we count visits: our site statistics use no cookies and no tracking
          ids. We only keep daily totals - how many pages were viewed, which kind
          of page, and roughly where visits came from - never your name, email,
          phone, IP address or the pages you personally visited. If your browser
          sends Do Not Track or Global Privacy Control, nothing is counted at all.
        </p>
      </Section>

      <Section tone="subtle" labelledBy="team-heading">
        <SectionHeader
          align="center"
          overline="Our team"
          title="The people behind SalonKhuji"
          titleId="team-heading"
        />
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {TEAM.map((member) => (
            <li
              key={member.name}
              className="flex flex-col items-center rounded-2xl border border-border bg-surface p-5 text-center sm:p-6"
            >
              <span
                aria-hidden
                className="grid size-16 place-items-center rounded-full bg-primary-soft font-display text-xl font-semibold text-primary-hover"
              >
                {initials(member.name)}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {member.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {member.role}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="dark" labelledBy="about-owners-heading">
        <SectionHeader
          tone="dark"
          overline="For salon owners"
          title="Own a salon?"
          titleId="about-owners-heading"
          description="Bring your salon online and take bookings from customers nearby."
        />
        <Button size="lg" asChild className="w-full sm:w-auto">
          <Link href="/become-salon-owner">List your salon</Link>
        </Button>
      </Section>
    </>
  );
}
