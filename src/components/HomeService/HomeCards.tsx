import Link from "next/link";
import { ArrowRight, BadgeCheck, Briefcase, Clock, MapPin, ShieldCheck, Star, Users } from "lucide-react";

import SafeImage from "@/components/Shared/SafeImage";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBDT } from "@/lib/money";
import { formatRating } from "@/lib/rating";
import { cn } from "@/lib/utils";
import type { HomeCatalogOffering, HomeExpertCard } from "@/services/home-service/types";
import { CATEGORY_ICON, CATEGORY_LABEL, durationText, initialsOf } from "./content";

export const HOME_GRID = "grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4";

const CARD =
  "group flex flex-col rounded-3xl border border-border bg-surface p-5 shadow-soft transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:translate-y-0";

export const kmText = (d: number) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);

export function VerifiedBadge() {
  return (
    <Badge variant="success" className="gap-1">
      <BadgeCheck className="size-3.5" aria-hidden />
      Verified
    </Badge>
  );
}

/** The expert's photo, or their initials on the brand tint when there is none. */
export function ExpertAvatar({ name, photo, className }: { name: string; photo: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-display font-semibold text-primary-hover ring-2 ring-surface",
        className,
      )}
    >
      {photo ? (
        <SafeImage src={photo} alt="" fill sizes="128px" className="object-cover" />
      ) : (
        <span aria-hidden>{initialsOf(name)}</span>
      )}
    </span>
  );
}

/** Stars and the review count, or "New" until the first review. */
export function RatingLine({ rating, reviews }: { rating: number; reviews: number }) {
  if (reviews === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-info-soft px-2 py-0.5 text-xs font-semibold text-info">
        New expert
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
      <Star className="size-4 fill-current text-gold" aria-hidden />
      {formatRating(rating)}
      <span className="font-normal text-muted-foreground">({reviews})</span>
    </span>
  );
}

/** One service on the "By service" grid; opens the experts who do it. */
export function OfferingCard({ offering, href }: { offering: HomeCatalogOffering; href: string }) {
  const Icon = CATEGORY_ICON[offering.category];
  return (
    <Link href={href} className={CARD}>
      <div className="flex items-start gap-4">
        <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gold/20 bg-primary-soft text-primary-hover">
          {offering.image ? (
            <SafeImage src={offering.image} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <Icon className="size-6" strokeWidth={1.75} aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-overline font-semibold uppercase tracking-[0.06em] text-primary">
            {CATEGORY_LABEL[offering.category]}
          </p>
          <h3 className="mt-1 font-display text-lg leading-snug font-semibold text-foreground group-hover:text-primary-hover">
            {offering.name}
          </h3>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" aria-hidden />
          {durationText(offering.durationMin)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4" aria-hidden />
          {offering.expertCount} expert{offering.expertCount === 1 ? "" : "s"} near you
        </span>
      </div>

      <span aria-hidden className="flex-1" />
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-sm text-muted-foreground">
          from <span className="font-display text-xl font-semibold text-foreground">{formatBDT(offering.minPriceMinor)}</span>
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          See experts
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** One expert on the "By expert" grid. */
export function ExpertCard({ expert, href, policyLine }: { expert: HomeExpertCard; href: string; policyLine: string }) {
  return (
    <Link href={href} className={CARD}>
      <div className="flex items-start gap-4">
        <ExpertAvatar name={expert.name} photo={expert.photo} className="size-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold text-foreground group-hover:text-primary-hover">
            {expert.name}
          </h3>
          {expert.headline && <p className="line-clamp-1 text-sm text-muted-foreground">{expert.headline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <VerifiedBadge />
            <RatingLine rating={expert.rating} reviews={expert.totalReviews} />
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <li className="flex min-w-0 items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {expert.salon.name}
            {expert.salon.area ? `, ${expert.salon.area}` : ""}
          </span>
          <span className="shrink-0 font-semibold text-foreground">{kmText(expert.distanceKm)}</span>
        </li>
        <li className="flex items-center gap-2">
          <Briefcase className="size-4 shrink-0" aria-hidden />
          {expert.completedJobs > 0
            ? `${expert.completedJobs} home visit${expert.completedJobs === 1 ? "" : "s"} done`
            : "No home visits yet"}
        </li>
        {expert.soonestLabel && (
          <li className="flex items-center gap-2 font-semibold text-success">
            <Clock className="size-4 shrink-0" aria-hidden />
            Free from {expert.soonestLabel}
          </li>
        )}
      </ul>

      <span aria-hidden className="flex-1" />
      <div className="mt-5 flex flex-wrap items-end justify-between gap-2 border-t border-border/60 pt-4">
        <p className="text-sm text-muted-foreground">
          from <span className="font-display text-xl font-semibold text-foreground">{formatBDT(expert.fromPriceMinor)}</span>
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-hover">
          <ShieldCheck className="size-3.5" aria-hidden />
          {policyLine}
        </span>
      </div>
    </Link>
  );
}

export function HomeGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-5 h-6 w-48" />
      <div className={HOME_GRID}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-3xl border border-border bg-surface p-5">
            <div className="flex gap-4">
              <Skeleton className="size-14 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChipsSkeleton() {
  return (
    <div aria-hidden className="flex gap-2 overflow-hidden">
      {[64, 96, 112, 96, 88, 104].map((w, i) => (
        <Skeleton key={i} className="h-9 shrink-0 rounded-full" style={{ width: w }} />
      ))}
    </div>
  );
}
