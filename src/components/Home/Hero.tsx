import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Check, MapPin } from "lucide-react";

import { Button } from "../ui/button";
import { IconTile } from "../Shared/FeatureCard";
import HeroSearch from "./HeroSearch";
import NearMeButton from "./NearMeButton";
import heroImg from "@/assets/hero-salon.jpg";
import { getPublicSettings } from "@/services/settings/getPublicSettings";

// Each one is true today: admin approves every salon, slots are live and
// prices go through formatBDT. Don't add claims that aren't.
const TRUST = ["Approved salons", "Real-time slots", "Prices in ৳"];

// No entrance animation: the LCP element (the H1) is in here.
// The chips come from the cookieless public settings (60 s), so / stays static.
const Hero = async () => {
  const settings = await getPublicSettings();
  const chips = settings.success ? settings.data?.["content.homeChips"] : undefined;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative -mt-16 overflow-hidden bg-background bg-glow-hero pt-24 pb-12 sm:pt-28 sm:pb-16 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center"
    >
      <div className="container mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="size-3.5" aria-hidden />
              Salon booking in Bangladesh
            </span>

            <h1
              id="hero-title"
              className="mt-5 font-display text-display-hero font-bold tracking-tight text-balance text-foreground lg:text-display-hero-lg"
            >
              Book trusted salons <span className="text-primary">near you</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Compare prices, see open slots and book in seconds. Pay from your
              SalonKhuji wallet.
            </p>

            <div className="mx-auto mt-8 max-w-xl lg:mx-0">
              <HeroSearch chips={chips} />
            </div>

            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center lg:justify-start">
              <NearMeButton className="w-full sm:w-auto" />
              <Button variant="link" asChild>
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
              {TRUST.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative ml-auto hidden w-full max-w-[520px] lg:block">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-card">
              {/* Desktop only (the column is hidden below lg), so no preload. */}
              <Image
                src={heroImg}
                alt="Inside a salon"
                fill
                sizes="(min-width: 1024px) 520px, 0px"
                placeholder="blur"
                className="object-cover"
              />
            </div>

            {/* Illustrative: what a booking looks like, not live data. */}
            <div
              aria-hidden
              className="absolute bottom-6 -left-6 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-card"
            >
              <IconTile icon={CalendarCheck} />
              <div>
                <p className="font-display text-sm font-semibold text-foreground">
                  Booking confirmed
                </p>
                <p className="text-sm text-muted-foreground">
                  Token #12 · 2:30 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
