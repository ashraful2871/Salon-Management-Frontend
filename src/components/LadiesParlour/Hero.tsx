import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Search, Star } from "lucide-react";

import NearMeButton from "@/components/Home/NearMeButton";
import SafeImage from "@/components/Shared/SafeImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import heroImg from "@/assets/hero-salon.jpg";
import { formatRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import { POPULAR, SEE_ALL } from "./content";
import { getLadiesParlours, withDistinctPhotos } from "./data";
import { Overline } from "./Heading";

// The arch and its outline share one shape. The top radius is half the
// widest arch, not rounded-full: an infinite radius makes the browser scale
// every corner down to fit, which squares off the bottom ones.
const ARCH = "rounded-t-[235px] rounded-b-[2.5rem]";

// No entrance animation: the LCP element (the H1) is in here.
export default function Hero() {
  return (
    <section
      aria-labelledby="ladies-hero-title"
      className="relative -mt-16 overflow-hidden bg-background bg-glow-gold pt-24 pb-14 sm:pt-28 lg:pt-32 lg:pb-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-20">
          <div className="text-center lg:text-left">
            <Overline align="responsive">Ladies parlours</Overline>

            <h1
              id="ladies-hero-title"
              className="mt-5 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-foreground sm:text-6xl lg:text-[4rem] xl:text-[4.25rem]"
            >
              Feel beautiful,{" "}
              <span className="text-primary">
                without the{" "}
                <span className="relative inline-block">
                  wait
                  <svg
                    aria-hidden
                    viewBox="0 0 120 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1.5 left-0 h-2.5 w-full text-gold/70 sm:-bottom-2 sm:h-3"
                  >
                    <path
                      d="M3 9C30 3.5 78 2 117 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Ladies-only parlours for hair, skin, nails and bridal looks.
              Compare prices and real reviews, then book an open time in a
              minute.
            </p>

            {/* A plain GET form: works before hydration, lands on the list
                with the ladies filter already on. */}
            <Form
              action="/salons"
              role="search"
              className="mx-auto mt-8 flex max-w-xl items-center gap-1.5 rounded-full border border-border bg-surface p-1.5 shadow-soft transition-colors focus-within:border-primary/50 lg:mx-0"
            >
              <input type="hidden" name="audience" value="LADIES" />
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="search"
                  name="searchTerm"
                  aria-label="Search ladies parlours"
                  placeholder="Facial, keratin, bridal makeup…"
                  className="h-11 w-full rounded-full bg-transparent pr-3 pl-11 text-base text-foreground outline-none placeholder:text-muted-foreground sm:h-12 [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
              <Button type="submit" size="lg" className="shrink-0 shadow-gold">
                <Search className="sm:hidden" aria-hidden />
                <span className="max-sm:sr-only">Search</span>
              </Button>
            </Form>

            <div className="mx-auto mt-4 flex max-w-xl items-baseline justify-center gap-3 lg:mx-0 lg:justify-start">
              <span className="shrink-0 text-sm text-muted-foreground max-sm:sr-only">Popular:</span>
              <ul
                aria-label="Popular searches"
                className="flex flex-wrap justify-center gap-2 lg:justify-start"
              >
                {POPULAR.map((chip) => (
                  <li key={chip.label}>
                    <Link
                      href={chip.href}
                      className="inline-flex h-9 items-center rounded-full border border-border bg-surface/80 px-3.5 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10"
                    >
                      {chip.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <NearMeButton
                size="lg"
                audience="LADIES"
                label="Ladies parlours near me"
                className="bg-surface"
              />
              <Button variant="ghost" size="lg" asChild>
                <Link href={SEE_ALL}>
                  Browse all parlours
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>

            <Suspense fallback={null}>
              <ParlourCount />
            </Suspense>
          </div>

          <Suspense fallback={<ArchSkeleton />}>
            <HeroArch />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

/** Three parlours' photos and how many ladies-only parlours there are. */
async function ParlourCount() {
  const data = await getLadiesParlours();
  const faces = withDistinctPhotos(data?.cards ?? [], 3);
  // A handful reads as empty rather than as proof.
  if (!data || data.total < 10 || faces.length < 3) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-3 lg:justify-start">
      <div aria-hidden className="flex -space-x-3">
        {faces.map((p) => (
          <span
            key={p.id}
            className="relative size-10 overflow-hidden rounded-full bg-muted ring-2 ring-background"
          >
            <SafeImage src={p.image} alt="" fill sizes="40px" className="object-cover" />
          </span>
        ))}
      </div>
      <p className="text-left text-sm leading-snug text-muted-foreground">
        <span className="font-semibold text-foreground">
          {data.total.toLocaleString("en-US")} ladies-only parlours
        </span>
        <br />
        each one checked by our team
      </p>
    </div>
  );
}

/**
 * The best-rated parlour's photo in an arch with its rating beside it, and a
 * second parlour in a circle. Desktop only: phones go straight to the search.
 * With no photos to show it falls back to the salon interior in the arch.
 */
async function HeroArch() {
  const data = await getLadiesParlours();
  const [main, inset] = withDistinctPhotos(data?.cards ?? [], 2);

  return (
    <div className="relative mx-auto hidden w-full max-w-[440px] lg:block xl:max-w-[470px]">
      <div
        aria-hidden
        className={cn(ARCH, "absolute inset-0 translate-x-5 translate-y-5 border border-gold/50")}
      />
      <div className={cn(ARCH, "relative aspect-[4/5] overflow-hidden bg-primary-soft shadow-card")}>
        {main ? (
          <Link
            href={`/salons/${main.id}`}
            aria-label={main.name}
            className="group block size-full focus-visible:outline-none"
          >
            <SafeImage
              src={main.image}
              alt=""
              fill
              preload
              sizes="(min-width: 1280px) 470px, (min-width: 1024px) 440px, 0px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </Link>
        ) : (
          <Image
            src={heroImg}
            alt=""
            fill
            sizes="(min-width: 1280px) 470px, (min-width: 1024px) 440px, 0px"
            placeholder="blur"
            className="object-cover"
          />
        )}
      </div>

      {inset && (
        <Link
          href={`/salons/${inset.id}`}
          aria-label={inset.name}
          className="absolute -bottom-8 -left-14 block size-36 overflow-hidden rounded-full border-[6px] border-background bg-muted shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:size-40"
        >
          <SafeImage src={inset.image} alt="" fill sizes="160px" className="object-cover" />
        </Link>
      )}

      {/* The arch's own parlour: its photo carries no caption of its own. */}
      {main && main.reviews > 0 && (
        <div className="absolute top-[40%] -right-4 flex items-center gap-3 rounded-2xl border border-border bg-surface/95 p-3 pr-4 shadow-card xl:-right-10">
          <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-gold">
            <Star className="size-5 fill-current" aria-hidden />
          </span>
          <span className="text-sm leading-tight">
            <span className="block font-semibold text-foreground">
              {formatRating(main.rating)} · {main.reviews} review{main.reviews === 1 ? "" : "s"}
            </span>
            <span className="block max-w-44 truncate text-muted-foreground">{main.name}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function ArchSkeleton() {
  return (
    <div className="hidden lg:block">
      <Skeleton className={cn(ARCH, "mx-auto aspect-[4/5] w-full max-w-[440px] xl:max-w-[470px]")} />
    </div>
  );
}
