"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, ExternalLink, MapPin, Navigation, Phone, Star } from "lucide-react";

import { formatDistance } from "@/lib/geo";
import { formatBDT } from "@/lib/money";
import { usableImage } from "@/lib/salon-card";
import type { Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import type { BlockProps } from "../block-props";
import { isBookable, salonPlace } from "./SalonCarousel";

type SalonDetailsBlock = Extract<Block, { type: "salon_details" }>;

const mapsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

/**
 * The salon the customer tapped: what it costs to hold a chair, how long they
 * have to change their mind, and the ways out of the chat (call, directions,
 * the full page) next to the way on (book).
 */
const SalonDetails = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<SalonDetailsBlock>) => {
  const { salon, policy } = block;
  const distance =
    salon.distanceMeters != null ? formatDistance(salon.distanceMeters) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="relative h-28 w-full overflow-hidden bg-muted">
        <Image
          src={usableImage(salon.image)}
          alt=""
          width={800}
          height={280}
          className="h-full w-full object-cover"
        />
        {salon.openNow !== null && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
            <Clock className="h-3 w-3 text-gold" aria-hidden />
            {salon.openNow ? "Open now" : "Closed"}
          </span>
        )}
      </div>

      <div className="space-y-3 p-3.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-semibold leading-snug text-foreground">
              {salon.name}
            </h4>
            <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-foreground">
              <Star className="h-4 w-4 fill-gold text-gold" aria-hidden />
              {(salon.rating ?? 0).toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground">
                ({salon.totalReviews ?? 0})
              </span>
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{policy.address || salonPlace(salon)}</span>
            {distance && <span className="shrink-0">· {distance}</span>}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-muted/50 px-2.5 py-2">
            <dt className="text-muted-foreground">Deposit to hold</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {formatBDT(policy.depositMinor)}
              {policy.depositPercent != null && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({policy.depositPercent}%)
                </span>
              )}
            </dd>
          </div>
          <div className="rounded-lg bg-muted/50 px-2.5 py-2">
            <dt className="text-muted-foreground">Free cancellation</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">
              {policy.cancellationWindowMin >= 60
                ? `${Math.round(policy.cancellationWindowMin / 60)} h before`
                : `${policy.cancellationWindowMin} min before`}
            </dd>
          </div>
        </dl>

        {isBookable(salon) ? (
          <p className="text-xs text-muted-foreground">
            {salon.serviceCount} service{salon.serviceCount === 1 ? "" : "s"} ·{" "}
            {salon.counterCount} chair{salon.counterCount === 1 ? "" : "s"}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            This salon has not set up online booking yet - you can still call
            them.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {(block.actions ?? []).map((option, i) => (
            <Chip
              key={`${option.label}-${i}`}
              label={option.label}
              icon={option.icon}
              style={option.style}
              selected={chosen === option.label}
              disabled={disabled}
              onClick={() => onAction(option.action, option.label)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {policy.phone && (
            <a
              href={`tel:${policy.phone}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3.5 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <Phone className="h-4 w-4" aria-hidden />
              Call
            </a>
          )}
          {policy.address && (
            <a
              href={mapsUrl(`${salon.name} ${policy.address}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3.5 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <Navigation className="h-4 w-4" aria-hidden />
              Directions
            </a>
          )}
          <Link
            href={`/salons/${salon.id}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3.5 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Full page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SalonDetails;
