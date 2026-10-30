import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock, Wallet } from "lucide-react";

import { Overline } from "@/components/LadiesParlour/Heading";
import { PublicPageHero } from "@/components/Shared/PublicPageHero";
import { Section, SectionHeader } from "@/components/Shared/Section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getPublicSettings, homeSettingsOf } from "@/services/settings/getPublicSettings";
import { FAQS, SAFETY, SIDES, STEPS, policyLineOf, sideEnabled } from "./content";
import { HomeTrack, SideLink } from "./HomeTrack";

/**
 * /home-service: what it is, the two sides (Ladies first and larger), how it
 * works, the safety promises, the payment line and the FAQ. Reads only the
 * public settings (60 s cache), so the page stays static.
 */
export default async function HomeLanding() {
  const res = await getPublicSettings();
  const s = homeSettingsOf(res.success ? res.data : null);
  const ladies = sideEnabled(s, "LADIES");
  const gents = sideEnabled(s, "GENTS");
  const open = ladies || gents;
  const advance = s["homeService.advancePercent"];

  return (
    <>
      <HomeTrack event="home_view" dim="audience:all" />
      <PublicPageHero
        overline="Home Service"
        title="Beauty experts at your home"
        description="Facials, threading, mehedi, haircuts and more, done at home by verified experts from salons near you."
      />

      {!open ? (
        <ComingSoon />
      ) : (
        <>
          <Section size="compact" labelledBy="home-sides">
            <h2 id="home-sides" className="sr-only">
              Choose a side
            </h2>
            <div className={gents && ladies ? "grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : "grid"}>
              {ladies && <LadiesCard />}
              {gents && <GentsCard compact={ladies} />}
            </div>
          </Section>

          <Section tone="subtle" labelledBy="home-how">
            <SectionHeader overline="How it works" title="Booked in four steps" titleId="home-how" />
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
                  <span className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary-hover">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section tone="dark" labelledBy="home-safety" className="bg-glow-dark">
            <SectionHeader
              overline="Your safety"
              title="Safe at your door"
              titleId="home-safety"
              tone="dark"
              description="Four promises on every home visit."
            />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SAFETY.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="grid size-11 place-items-center rounded-full border border-gold-light/30 text-gold-light">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{text}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section size="compact" labelledBy="home-payment">
            <div className="grid gap-6 rounded-[2rem] border border-border bg-surface p-6 shadow-soft sm:p-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <SectionHeader overline="Payment & cancellation" title={`Pay ${advance}% now, ${100 - advance}% at home`} titleId="home-payment" />
                <ul className="-mt-4 space-y-3 text-sm text-muted-foreground sm:text-base">
                  <li className="flex gap-3">
                    <Wallet className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    The advance is held safely and reaches the salon only after your visit.
                  </li>
                  <li className="flex gap-3">
                    <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="font-semibold text-foreground">{policyLineOf(s)}.</span> The full terms are
                      shown before you pay.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    If the salon cancels, you get the whole advance back.
                  </li>
                </ul>
              </div>
              <Button size="lg" asChild className="w-full md:w-auto">
                <SideLink audience={ladies ? "LADIES" : "GENTS"} href={SIDES[ladies ? "LADIES" : "GENTS"].href}>
                  Find an expert
                  <ArrowRight aria-hidden />
                </SideLink>
              </Button>
            </div>
          </Section>
        </>
      )}

      <Section tone="subtle" labelledBy="home-faq">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <SectionHeader
            overline="Questions"
            title="Good to know"
            titleId="home-faq"
            description="Still unsure? Our support team is a message away."
          />
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
    </>
  );
}

function LadiesCard() {
  return (
    <article className="flex flex-col justify-between gap-8 rounded-[2rem] border border-gold/25 bg-primary-soft bg-glow-gold p-6 sm:p-10">
      <div>
        <Overline>Most booked</Overline>
        <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {SIDES.LADIES.title}
        </h3>
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Facial, threading, waxing, mehedi, party makeup and bridal, at home.
        </p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-surface px-3.5 py-1.5 text-sm font-semibold text-foreground">
          <BadgeCheck className="size-4 text-primary" aria-hidden />
          100% female, ID-verified experts
        </p>
      </div>
      <Button size="lg" asChild className="w-full shadow-gold sm:w-auto sm:self-start">
        <SideLink audience="LADIES" href={SIDES.LADIES.href}>
          Book a female expert
          <ArrowRight aria-hidden />
        </SideLink>
      </Button>
    </article>
  );
}

function GentsCard({ compact }: { compact: boolean }) {
  return (
    <article className="flex flex-col justify-between gap-8 rounded-[2rem] border border-border bg-surface p-6 sm:p-8">
      <div>
        <h3 className={compact ? "font-display text-2xl font-semibold text-foreground" : "font-display text-3xl font-semibold text-foreground"}>
          {SIDES.GENTS.title}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Haircut, beard, facial and grooming by verified male experts.
        </p>
      </div>
      <Button variant="outline" size="lg" asChild className="w-full sm:w-auto sm:self-start">
        <SideLink audience="GENTS" href={SIDES.GENTS.href}>
          Book a male expert
          <ArrowRight aria-hidden />
        </SideLink>
      </Button>
    </article>
  );
}

function ComingSoon() {
  return (
    <Section size="compact" labelledBy="home-soon">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-gold/25 bg-primary-soft px-6 py-10 text-center sm:px-10">
        <Overline align="center">Coming soon</Overline>
        <h2 id="home-soon" className="mt-4 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Home Service is on its way
        </h2>
        <p className="mt-2 text-muted-foreground">
          We are getting our experts ready. Until then, book a visit at a salon near you.
        </p>
        <Button size="lg" asChild className="mt-6 w-full sm:w-auto">
          <Link href="/salons">Find a salon</Link>
        </Button>
      </div>
    </Section>
  );
}
