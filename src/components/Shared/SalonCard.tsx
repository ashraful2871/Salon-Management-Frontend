"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { formatRating } from "@/lib/rating";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

interface SalonCardProps {
  salon: {
    id: string;
    name: string;
    rating: number;
    reviews: number;
    location: string;
    image: string;
    services: string[];
    // null: the salon has not listed its hours, so say nothing rather than "Closed".
    openNow: boolean | null;
    /** Cheapest active service, in poisha. Absent or null hides "From". */
    minPriceMinor?: number | null;
  };
  index: number;
  // Preformatted by formatDistance; a leading "~" marks an approximate pin.
  distance?: string;
  /** Above-the-fold cards load their photo eagerly. */
  priority?: boolean;
  className?: string;
}

/**
 * The salon card used by the list, the home strip and AI search.
 *
 * The whole card is one link: the name's link stretches over the card with an
 * `after:` overlay, so there is a single tab stop and a sensible accessible
 * name, and "Book now" is a visual cue rather than a second link.
 */
const SalonCard = ({
  salon,
  index,
  distance,
  priority = false,
  className,
}: SalonCardProps) => {
  const reduceMotion = useReducedMotion();
  const approximate = distance?.startsWith("~") ?? false;
  const href = `/salons/${salon.id}`;
  const extraServices = salon.services.length - 2;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      // Capped, so the twelfth card is not left waiting a second to appear.
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05 }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-[box-shadow,transform,border-color] duration-300",
        "hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card",
        "focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={salon.image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10"
        />

        {distance && (
          <span
            title={
              approximate
                ? "Approximate location. The salon hasn't pinned its exact spot yet."
                : undefined
            }
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-charcoal shadow-sm backdrop-blur-sm"
          >
            <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            {distance}
            {approximate && (
              <span className="sr-only"> (approximate location)</span>
            )}
          </span>
        )}

        {salon.openNow !== null && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-charcoal shadow-sm backdrop-blur-sm">
            <span
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full",
                salon.openNow ? "bg-emerald-500" : "bg-slate-400",
              )}
            />
            {salon.openNow ? "Open now" : "Closed"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-base font-semibold leading-snug text-foreground sm:text-lg">
            <Link
              href={href}
              className="line-clamp-1 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {salon.name}
            </Link>
          </h3>

          {salon.reviews > 0 ? (
            <span
              className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-sm"
              aria-label={`Rated ${formatRating(salon.rating)} out of 5 from ${salon.reviews} review${salon.reviews === 1 ? "" : "s"}`}
            >
              <Star className="h-4 w-4 fill-gold text-gold" aria-hidden="true" />
              <span className="font-semibold text-foreground">
                {formatRating(salon.rating)}
              </span>
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                ({salon.reviews})
              </span>
            </span>
          ) : (
            <span className="mt-0.5 shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-dark">
              New
            </span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{salon.location}</span>
        </p>

        {salon.services.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Services">
            {salon.services.slice(0, 2).map((service) => (
              <li
                key={service}
                className="max-w-full truncate rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80"
              >
                {service}
              </li>
            ))}
            {extraServices > 0 && (
              <li className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                +{extraServices} more
              </li>
            )}
          </ul>
        )}

        {/* Pushes the footer to the bottom, so a row of cards lines up. */}
        <div aria-hidden="true" className="min-h-4 flex-1" />

        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          {salon.minPriceMinor != null && salon.minPriceMinor > 0 ? (
            <p className="text-xs text-muted-foreground">
              From{" "}
              <span className="text-base font-bold tabular-nums text-foreground">
                {formatBDT(salon.minPriceMinor)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">See services &amp; prices</p>
          )}
          <span
            aria-hidden="true"
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors group-hover:bg-gold-dark"
          >
            Book now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default SalonCard;
