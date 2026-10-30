import Link from "next/link";
import { ArrowRight, BadgeCheck, KeyRound, Wallet } from "lucide-react";

import { Overline } from "@/components/LadiesParlour/Heading";
import { Section } from "@/components/Shared/Section";
import { Button } from "@/components/ui/button";
import { getPublicSettings, homeSettingsOf } from "@/services/settings/getPublicSettings";
import { SIDES, sideEnabled } from "./content";
import { SideLink } from "./HomeTrack";

/**
 * The home page's "Beauty at home" band: a big Ladies card and a Gents link.
 * Reads only the public settings (60 s cache), so `/` stays static; renders
 * nothing while Home Service is off.
 */
export default async function BeautyAtHomeSection() {
  const res = await getPublicSettings();
  const s = homeSettingsOf(res.success ? res.data : null);
  const ladies = sideEnabled(s, "LADIES");
  const gents = sideEnabled(s, "GENTS");
  if (!ladies && !gents) return null;
  const advance = s["homeService.advancePercent"];

  return (
    <Section size="compact" labelledBy="beauty-at-home">
      <div className="grid gap-8 rounded-[2rem] border border-gold/25 bg-primary-soft bg-glow-gold p-6 sm:p-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
        <div>
          <Overline>Beauty at home</Overline>
          <h2
            id="beauty-at-home"
            className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
          >
            {ladies ? "A female expert, at your door" : "A grooming expert, at your door"}
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {ladies
              ? "Facial, threading, mehedi and makeup at home. 100% female, ID-verified experts from salons near you."
              : "Haircut, beard and grooming at home by verified experts from salons near you."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="shadow-gold">
              <SideLink audience={ladies ? "LADIES" : "GENTS"} href={SIDES[ladies ? "LADIES" : "GENTS"].href}>
                {ladies ? "Book Ladies at Home" : "Book Gents at Home"}
                <ArrowRight aria-hidden />
              </SideLink>
            </Button>
            {ladies && gents && (
              <Button variant="ghost" size="lg" asChild>
                <SideLink audience="GENTS" href={SIDES.GENTS.href}>
                  Gents at Home
                </SideLink>
              </Button>
            )}
          </div>
        </div>

        <ul className="grid gap-3 text-sm">
          {[
            { icon: BadgeCheck, text: ladies ? "Female experts only for ladies, ID-checked" : "Every expert ID-checked" },
            { icon: Wallet, text: `Pay ${advance}% now, the rest at home` },
            { icon: KeyRound, text: "The visit starts only with your code" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-surface/80 p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-hover">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="font-semibold text-foreground">{text}</span>
            </li>
          ))}
          <li>
            <Link href="/home-service" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              How Home Service works
            </Link>
          </li>
        </ul>
      </div>
    </Section>
  );
}

/** The /ladies-parlour band: "Prefer at home?" → the Ladies list; nothing while that side is off. */
export async function LadiesAtHomeBand() {
  const res = await getPublicSettings();
  if (!sideEnabled(homeSettingsOf(res.success ? res.data : null), "LADIES")) return null;
  return (
    <Section size="compact" labelledBy="ladies-at-home">
      <div className="flex flex-col items-start gap-6 rounded-[2rem] border border-gold/25 bg-surface px-6 py-8 shadow-soft sm:px-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <Overline>Ladies at Home</Overline>
          <h2 id="ladies-at-home" className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Prefer at home? Book a female expert
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            The same services in your own home, by ID-verified female experts from parlours near you.
          </p>
        </div>
        <Button size="lg" asChild className="w-full shrink-0 shadow-gold sm:w-auto">
          <SideLink audience="LADIES" href={SIDES.LADIES.href}>
            See experts near me
            <ArrowRight aria-hidden />
          </SideLink>
        </Button>
      </div>
    </Section>
  );
}
