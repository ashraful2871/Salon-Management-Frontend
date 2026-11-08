import Link from "next/link";
import { ArrowRight, BadgeCheck, KeyRound, Wallet } from "lucide-react";

import { Overline } from "@/components/LadiesParlour/Heading";
import { Section } from "@/components/Shared/Section";
import { Button } from "@/components/ui/button";
import { getPublicSettings, homeSettingsOf } from "@/services/settings/getPublicSettings";
import { sideEnabled } from "./content";
import { SideLink } from "./HomeTrack";

/**
 * The home page's "Beauty at home" band. Ladies-led (Gents follows
 * `homeService.gentsEnabled` and is booked from a Gents salon). Visits are booked from a
 * parlour's page, so it leads to how it works and to the parlour list. Reads
 * only the public settings (60 s cache), so `/` stays static; renders nothing
 * while the Ladies side is off.
 */
export default async function BeautyAtHomeSection() {
  const res = await getPublicSettings();
  const s = homeSettingsOf(res.success ? res.data : null);
  const ladies = sideEnabled(s, "LADIES");
  if (!ladies) return null;
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
            A female expert, at your door
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Facial, threading, mehedi and makeup at home. 100% female, ID-verified experts from parlours near you.
            Open a parlour and choose At home when you book.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="shadow-gold">
              <SideLink audience="LADIES" href="/home-service">
                How Home Service works
                <ArrowRight aria-hidden />
              </SideLink>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href="/ladies-parlour">Find a parlour</Link>
            </Button>
          </div>
        </div>

        <ul className="grid gap-3 text-sm">
          {[
            { icon: BadgeCheck, text: "Female experts only, ID-checked" },
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
        </ul>
      </div>
    </Section>
  );
}

/** "Prefer at home?" → how Home Service works; nothing while the Ladies side is off. Not placed on any page now. */
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
          <SideLink audience="LADIES" href="/home-service">
            How it works
            <ArrowRight aria-hidden />
          </SideLink>
        </Button>
      </div>
    </Section>
  );
}
