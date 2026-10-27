import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Check, Search, Star } from "lucide-react";

import NearMeButton from "@/components/Home/NearMeButton";
import SafeImage from "@/components/Shared/SafeImage";
import SalonCard from "@/components/Shared/SalonCard";
import { SNAP_ITEM, SNAP_ROW, Section, SectionHeader } from "@/components/Shared/Section";
import { SalonCardSkeleton } from "@/components/Shared/SkeletonCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toSalonCardData, type SalonCardData } from "@/lib/salon-card";
import { cn } from "@/lib/utils";
import { getAllSalon } from "@/services/salon/getAllSalon";
import type { ParlourAudience, ParlourContent } from "./parlour-content";

/** How many top-rated salons to read: `?audience=` also returns unisex ones,
 *  which this page leaves out, so it reads a few more than it shows. */
const READ = 40;
const SHOW = 8;
const MIN_CARDS = 3;

const ROW_CLASS = cn(SNAP_ROW, "lg:grid-cols-4");

/**
 * Only this audience's own parlours, best rated first; unrated ones fill in
 * when too few have reviews. The hero and the row make the same call, which
 * Next dedupes into one request.
 */
async function getParlours(audience: ParlourAudience): Promise<SalonCardData[] | null> {
  const res = await getAllSalon({ audience, sort: "rating", limit: READ });
  if (!res.success) return null;
  const own = (res.data ?? []).filter((s) => s.audience === audience);
  const cards = own.map(toSalonCardData);
  const rated = cards.filter((c) => c.reviews > 0);
  return (rated.length >= MIN_CARDS ? rated : cards).slice(0, SHOW);
}

export default function ParlourPage({ content }: { content: ParlourContent }) {
  const { theme } = content;
  const seeAll = `/salons?audience=${content.audience}&sort=rating`;

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section
        aria-labelledby="parlour-hero-title"
        className={cn("relative -mt-16 overflow-hidden pt-24 pb-14 sm:pt-28 lg:pb-20", theme.heroBg)}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div className="text-center lg:text-left">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                  theme.eyebrow,
                )}
              >
                {content.hero.eyebrow}
              </span>

              <h1
                id="parlour-hero-title"
                className="mt-5 font-display text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl"
              >
                {content.hero.titleStart}{" "}
                <span className={theme.accentText}>{content.hero.titleAccent}</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
                {content.hero.subtitle}
              </p>

              {/* A plain GET form: works before hydration, lands on the list
                  with this audience already picked. */}
              <Form
                action="/salons"
                role="search"
                className="mx-auto mt-8 flex max-w-xl items-center gap-1.5 rounded-full border border-border bg-surface p-1.5 shadow-card focus-within:border-foreground/30 lg:mx-0"
              >
                <input type="hidden" name="audience" value={content.audience} />
                <div className="relative min-w-0 flex-1">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="search"
                    name="searchTerm"
                    aria-label={`Search ${content.plural}`}
                    placeholder={content.hero.searchPlaceholder}
                    className="h-11 w-full rounded-full bg-transparent pr-3 pl-11 text-base text-foreground outline-none placeholder:text-muted-foreground sm:h-12 [&::-webkit-search-cancel-button]:hidden"
                  />
                </div>
                <Button type="submit" size="lg" className={cn("shrink-0 rounded-full", theme.primaryButton)}>
                  <Search className="sm:hidden" aria-hidden />
                  <span className="max-sm:sr-only">Search</span>
                </Button>
              </Form>

              <ul
                aria-label="Popular searches"
                className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start"
              >
                {content.hero.chips.map((chip) => (
                  <li key={chip.label}>
                    <Link
                      href={chip.href}
                      className={cn(
                        "inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10",
                        theme.chip,
                      )}
                    >
                      {chip.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <NearMeButton
                  size="lg"
                  audience={content.audience}
                  label={`${content.singular}s near me`}
                  iconClassName={theme.nearIcon}
                  className={theme.outlineButton}
                />
                <Button variant="ghost" size="lg" asChild>
                  <Link href={seeAll}>
                    Browse all
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                {content.hero.trust.map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className={cn("size-4", theme.accentText)} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Suspense fallback={<MosaicSkeleton />}>
              <HeroMosaic content={content} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ services */}
      <Section labelledBy="parlour-services">
        <SectionHeader
          overline="Services"
          title={content.services.title}
          titleId="parlour-services"
          description={content.services.description}
        />
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {content.services.tiles.map((tile) => (
            <li key={tile.title}>
              <Link
                href={tile.href}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border border-border bg-surface p-4 transition-[border-color,box-shadow,transform] duration-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 motion-safe:hover:-translate-y-0.5 sm:p-5",
                  theme.tileHover,
                )}
              >
                <span className={cn("grid size-11 place-items-center rounded-xl", theme.tileIcon)}>
                  <tile.icon className="size-5" aria-hidden />
                </span>
                <span className="mt-4 font-display text-[15px] font-semibold text-foreground sm:text-base">
                  {tile.title}
                </span>
                <span className="mt-1 text-sm leading-snug text-muted-foreground">
                  {tile.description}
                </span>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-foreground/80 group-hover:text-foreground">
                  Find parlours
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* ----------------------------------------------------- top rated */}
      <Suspense fallback={<TopRowSkeleton content={content} />}>
        <TopParlours content={content} seeAll={seeAll} />
      </Suspense>

      {/* ----------------------------------------------------- occasions */}
      <section aria-labelledby="parlour-occasions" className={cn("py-14 md:py-20", theme.band)}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-overline font-semibold tracking-[0.06em] text-white/70 uppercase">
                {content.occasions.overline}
              </p>
              <h2
                id="parlour-occasions"
                className="mt-2 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl"
              >
                {content.occasions.title}
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">
                {content.occasions.description}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {content.occasions.tiles.map((tile) => (
                <li key={tile.title}>
                  <Link
                    href={tile.href}
                    className={cn(
                      "group flex h-full items-start gap-4 rounded-2xl border p-5 transition-colors focus-visible:outline-none focus-visible:ring-2",
                      theme.bandCard,
                    )}
                  >
                    <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", theme.bandIcon)}>
                      <tile.icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 font-display text-base font-semibold">
                        {tile.title}
                        <ArrowRight
                          className="size-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-white/75">
                        {tile.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ features */}
      <Section labelledBy="parlour-why">
        <SectionHeader
          overline="Why book here"
          title="Booking that respects your time"
          titleId="parlour-why"
          align="center"
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {content.features.map((f) => (
            <li key={f.title} className="text-center">
              <span className={cn("mx-auto grid size-12 place-items-center rounded-full", theme.tileIcon)}>
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* -------------------------------------------------- how it works */}
      <Section tone="subtle" labelledBy="parlour-steps">
        <SectionHeader overline="How it works" title="Booked in three steps" titleId="parlour-steps" align="center" />
        <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3 md:gap-6">
          {content.steps.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-surface p-6">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full font-display text-sm font-bold",
                  theme.stepNumber,
                )}
              >
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ----------------------------------------------------------- FAQ */}
      <Section labelledBy="parlour-faq">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <SectionHeader
            overline="Questions"
            title="Good to know"
            titleId="parlour-faq"
            description="Still unsure? Our support team is a message away."
            action={
              <Button variant="outline" asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
            }
          />
          <Accordion type="single" collapsible className="border-t border-border">
            {content.faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="min-h-14 items-center text-left text-base font-semibold">
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

      {/* ---------------------------------------------------- owner CTA */}
      <Section size="compact">
        <div
          className={cn(
            "flex flex-col items-start gap-5 rounded-3xl border p-6 sm:p-10 md:flex-row md:items-center md:justify-between",
            theme.ctaBg,
          )}
        >
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {content.cta.title}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">{content.cta.description}</p>
          </div>
          <Button size="lg" asChild className={cn("w-full shrink-0 sm:w-auto", theme.primaryButton)}>
            <Link href="/become-salon-owner">
              List your parlour
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------- pieces */

/** Three real parlour photos and the best one's rating; drawn tiles when
 *  there are too few photos. Desktop only: phones go straight to search. */
async function HeroMosaic({ content }: { content: ParlourContent }) {
  const parlours = (await getParlours(content.audience)) ?? [];
  const withPhoto = parlours.filter((p) => p.image).slice(0, 3);
  const top = parlours.find((p) => p.reviews > 0);

  if (withPhoto.length < 3) {
    return (
      <div
        aria-hidden
        className={cn("relative hidden aspect-[4/5] max-h-[560px] rounded-[2rem] bg-gradient-to-br lg:block", content.theme.mosaicFallback)}
      />
    );
  }

  return (
    <div className="relative hidden lg:block">
      <div className="grid h-[520px] grid-cols-[1.15fr_1fr] grid-rows-2 gap-4">
        {withPhoto.map((p, i) => (
          <Link
            key={p.id}
            href={`/salons/${p.id}`}
            className={cn(
              "group relative overflow-hidden rounded-[1.75rem] bg-muted ring-1 ring-black/5",
              i === 0 && "row-span-2",
            )}
          >
            <SafeImage
              src={p.image}
              alt={p.name}
              fill
              sizes="(min-width: 1024px) 28vw, 0px"
              priority={i === 0}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4 pt-12 text-sm font-semibold text-white">
              {p.name}
            </span>
          </Link>
        ))}
      </div>

      {top && (
        <div className="absolute -left-6 top-10 flex items-center gap-3 rounded-2xl border border-border bg-surface/95 p-3 pr-4 shadow-card">
          <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-500">
            <Star className="size-5 fill-current" aria-hidden />
          </span>
          <span className="text-sm leading-tight">
            <span className="block font-semibold text-foreground">
              {top.rating.toFixed(1)} · {top.reviews} reviews
            </span>
            <span className="block max-w-44 truncate text-muted-foreground">{top.name}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function MosaicSkeleton() {
  return <Skeleton className="hidden h-[520px] rounded-[1.75rem] lg:block" />;
}

async function TopParlours({ content, seeAll }: { content: ParlourContent; seeAll: string }) {
  const cards = await getParlours(content.audience);
  if (!cards || cards.length < MIN_CARDS) return null;

  return (
    <Section tone="subtle" labelledBy="parlour-top">
      <SectionHeader
        overline="Top rated"
        title={`${content.singular}s customers love`}
        titleId="parlour-top"
        description="Rated by customers after their visit."
        action={
          <Button variant="outline" asChild>
            <Link href={seeAll}>
              See all
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />
      <ul aria-label={`Top rated ${content.plural}`} className={ROW_CLASS}>
        {cards.map((card, i) => (
          <li key={card.id} className={SNAP_ITEM}>
            <SalonCard salon={card} index={i} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function TopRowSkeleton({ content }: { content: ParlourContent }) {
  return (
    <Section tone="subtle" labelledBy="parlour-top">
      <SectionHeader overline="Top rated" title={`${content.singular}s customers love`} titleId="parlour-top" />
      <div aria-busy="true" aria-label="Loading parlours" className={ROW_CLASS}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={SNAP_ITEM}>
            <SalonCardSkeleton />
          </div>
        ))}
      </div>
    </Section>
  );
}
