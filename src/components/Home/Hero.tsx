import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, ShieldCheck, Tag } from "lucide-react";

import HeroSearch from "./HeroSearch";
import NearMeButton from "./NearMeButton";
import heroImg from "@/assets/hero-salon.jpg";
import { getPublicSettings } from "@/services/settings/getPublicSettings";

// Each one is true today: admin approves every salon, slots are live and every
// service shows its price before booking. Don't add claims that aren't.
const TRUST = [
  { icon: ShieldCheck, label: "Approved salons", long: "Approved salons only" },
  { icon: Clock, label: "Live slots", long: "Live open slots" },
  { icon: Tag, label: "Upfront prices", long: "Prices shown upfront" },
];

/**
 * Two layouts from one tree, no entrance animation (the H1 is the LCP):
 * - phones: the photo as a clear band on top, then the copy and search on the
 *   light page background, left-aligned like an app;
 * - md and up: one framed full-width photo with the copy and search on it.
 * The chips come from the cookieless public settings (60 s), so / stays static.
 */
const Hero = async () => {
  const settings = await getPublicSettings();
  const chips = settings.success ? settings.data?.["content.homeChips"] : undefined;

  return (
    <section aria-labelledby="hero-title" className="px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6">
      <div className="relative isolate md:flex md:min-h-[600px] md:overflow-hidden md:rounded-[2rem] md:bg-charcoal lg:min-h-[min(calc(100svh-6rem),780px)]">
        {/* The photo: a band on phones, the whole background from md. */}
        <div className="relative h-52 overflow-hidden rounded-3xl bg-charcoal min-[400px]:h-60 md:absolute md:inset-0 md:-z-10 md:h-auto md:rounded-none">
          <Image
            src={heroImg}
            alt=""
            fill
            preload
            sizes="100vw"
            placeholder="blur"
            className="object-cover object-[60%_50%] md:object-[70%_50%]"
          />
          {/* Phones: just enough shade for the label. md+: readable copy on
              the left, the salon showing through on the right. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent md:bg-gradient-to-r md:from-black/85 md:via-black/55 md:to-black/0"
          />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft md:hidden">
            <MapPin className="size-3.5 text-primary-hover" aria-hidden />
            Salons &amp; parlours across Bangladesh
          </span>
        </div>

        <div className="container mx-auto flex w-full flex-col px-1 pt-7 md:justify-center md:px-10 md:py-16 lg:px-14">
          <div className="max-w-2xl">
            <p className="hidden text-sm font-semibold uppercase tracking-[0.2em] text-gold-light md:block">
              Salons &amp; parlours across Bangladesh
            </p>

            <h1
              id="hero-title"
              className="font-display text-[2.125rem] font-bold leading-[1.1] tracking-tight text-balance text-foreground md:mt-4 md:text-6xl md:leading-[1.05] md:text-white lg:text-7xl"
            >
              Book trusted salons{" "}
              <span className="text-primary md:text-white">near you</span>
            </h1>

            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground text-pretty md:mt-5 md:text-lg md:text-white/80">
              Compare prices, see free times and book your next look in a few
              taps.
            </p>

            <div className="mt-6 md:mt-8">
              <HeroSearch chips={chips} />
            </div>

            <div className="mt-4 flex items-center gap-2 md:mt-6">
              <NearMeButton
                className="h-12 w-full md:h-11 md:w-auto md:border-white/30 md:bg-white/10 md:text-white md:hover:border-white/50 md:hover:bg-white/20 md:hover:text-white"
                iconClassName="text-primary md:text-gold-light"
              />
              <Link
                href="#how-it-works"
                className="group hidden h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:inline-flex"
              >
                How it works
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>

          <ul className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface py-3 md:mt-14 md:flex md:flex-wrap md:gap-x-6 md:gap-y-2 md:divide-x-0 md:rounded-none md:border-0 md:border-t md:border-white/15 md:bg-transparent md:px-0 md:pb-0 md:pt-5">
            {TRUST.map(({ icon: Icon, label, long }) => (
              <li
                key={label}
                className="flex flex-col items-center gap-1 px-1 text-center text-xs font-medium text-foreground md:flex-row md:gap-2 md:px-0 md:text-sm md:font-normal md:text-white/75"
              >
                <Icon className="size-4 text-primary-hover md:text-gold-light" aria-hidden />
                <span className="md:hidden">{label}</span>
                <span className="hidden md:inline">{long}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Hero;
