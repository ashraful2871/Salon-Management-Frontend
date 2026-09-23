"use client";

import Image from "next/image";
import { Clock, MapPin, Star } from "lucide-react";

import { formatDistance } from "@/lib/geo";
import { formatBDT } from "@/lib/money";
import { usableImage } from "@/lib/salon-card";
import { cn } from "@/lib/utils";
import type { AssistantSalonCard, Block } from "@/lib/assistant-types";
import Chip from "../Chip";
import type { BlockProps, SendAction } from "../block-props";

type SalonCarouselBlock = Extract<Block, { type: "salon_carousel" }>;

export const isBookable = (salon: AssistantSalonCard) =>
  (salon.serviceCount ?? 0) > 0 && (salon.counterCount ?? 0) > 0;

export const salonPlace = (salon: AssistantSalonCard) =>
  [salon.area, salon.city].filter((v) => v && v !== "N/A").join(", ") ||
  "Bangladesh";

/**
 * One card, sized for a 360 px screen: the picture, the three numbers that
 * decide it (distance, rating, cheapest service) and one button. The reasons
 * come from the server already written out - "1.2 km away", "Open now".
 */
const CarouselCard = ({
  salon,
  disabled,
  selected,
  onAction,
}: {
  salon: AssistantSalonCard;
  disabled: boolean;
  selected: boolean;
  onAction: SendAction;
}) => {
  const bookable = isBookable(salon);
  const distance =
    salon.distanceMeters != null ? formatDistance(salon.distanceMeters) : null;

  return (
    <article
      className={cn(
        "flex w-[232px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-background",
        selected ? "border-primary/60 shadow-sm" : "border-border",
      )}
    >
      <div className="relative h-24 w-full overflow-hidden bg-muted">
        <Image
          src={usableImage(salon.image)}
          alt=""
          width={464}
          height={192}
          className="h-full w-full object-cover"
        />
        {distance && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
            <MapPin className="h-3 w-3 text-gold" aria-hidden />
            {distance}
          </span>
        )}
        {salon.openNow !== null && (
          <span
            className={cn(
              "absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm",
              salon.openNow
                ? "bg-primary text-primary-foreground"
                : "bg-background/90 text-muted-foreground backdrop-blur-sm",
            )}
          >
            <Clock className="h-3 w-3" aria-hidden />
            {salon.openNow ? "Open now" : "Closed"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {salon.name}
          </h4>
          <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-foreground">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
            {(salon.rating ?? 0).toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({salon.totalReviews ?? 0})
            </span>
          </span>
        </div>

        <p className="line-clamp-1 text-xs text-muted-foreground">
          {salonPlace(salon)}
        </p>

        {salon.priceFromMinor != null && (
          <p className="text-xs text-muted-foreground">
            From{" "}
            <span className="font-semibold text-foreground">
              {formatBDT(salon.priceFromMinor)}
            </span>
          </p>
        )}

        {salon.reasons?.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {salon.reasons.slice(0, 2).map((reason) => (
              <li
                key={reason}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {reason}
              </li>
            ))}
          </ul>
        )}

        <Chip
          label={bookable ? "See times" : "See details"}
          style={bookable ? "primary" : "ghost"}
          selected={selected}
          disabled={disabled}
          onClick={() =>
            onAction({ type: "choose_salon", salonId: salon.id }, salon.name)
          }
          className="mt-auto w-full"
        />

        {!bookable && (
          <p className="text-[11px] leading-snug text-muted-foreground">
            Not set up for online booking yet.
          </p>
        )}
      </div>
    </article>
  );
};

const SalonCarousel = ({
  block,
  disabled,
  chosen,
  onAction,
}: BlockProps<SalonCarouselBlock>) => {
  const salons = block.salons ?? [];
  if (salons.length === 0) return null;

  return (
    <div>
      <div
        className="flex snap-x gap-3 overflow-x-auto pb-2"
        // A row of cards is a list; the panel itself is the live region.
        role="list"
        aria-label="Salons"
      >
        {salons.map((salon) => (
          <div role="listitem" key={salon.id} className="flex">
            <CarouselCard
              salon={salon}
              disabled={disabled}
              selected={chosen === salon.name}
              onAction={onAction}
            />
          </div>
        ))}
      </div>

      {block.nextPage && (
        <div className="pt-1">
          <Chip
            label="More salons"
            disabled={disabled}
            onClick={() => onAction(block.nextPage!, "More salons")}
          />
        </div>
      )}
    </div>
  );
};

export default SalonCarousel;
