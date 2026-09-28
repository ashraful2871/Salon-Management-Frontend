import Link from "next/link";
import { Star } from "lucide-react";

import { SNAP_ITEM, SNAP_ROW, Section, SectionHeader } from "../Shared/Section";
import { cn } from "@/lib/utils";
import { getRecentReviews } from "@/services/review/getRecentReviews";

// Short or lukewarm reviews say little on a home page; too few read as empty,
// so below MIN_REVIEWS the section is left out.
const MIN_RATING = 4;
const MIN_COMMENT_LENGTH = 20;
const MAX_REVIEWS = 6;
const MIN_REVIEWS = 3;

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

/** "Nusrat Jahan Rahman" → "Nusrat R." — enough to be real, not enough to find someone. */
function shortName(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "A customer";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div role="img" aria-label={`Rated ${rounded} out of 5`} className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn("size-4", i < rounded ? "fill-gold text-gold" : "text-border")}
        />
      ))}
    </div>
  );
}

export default async function RecentReviews() {
  const result = await getRecentReviews();
  if (!result.success || !Array.isArray(result.data)) return null;

  const reviews = result.data
    .filter(
      (review) =>
        review.rating >= MIN_RATING &&
        (review.comment?.trim().length ?? 0) >= MIN_COMMENT_LENGTH,
    )
    .slice(0, MAX_REVIEWS);
  if (reviews.length < MIN_REVIEWS) return null;

  return (
    <Section labelledBy="reviews-heading">
      <SectionHeader
        overline="Reviews"
        title="What customers say"
        titleId="reviews-heading"
        description="Recent reviews from real bookings."
      />
      <ul className={SNAP_ROW}>
        {reviews.map((review) => {
          const name = shortName(review.customer?.name);
          return (
            <li
              key={review.id}
              className={cn(
                SNAP_ITEM,
                "flex flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6",
              )}
            >
              <Stars rating={review.rating} />
              <p className="mt-3 line-clamp-4 flex-1 text-base text-foreground">
                {review.comment?.trim()}
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {initials(name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  {review.salon && (
                    <p className="truncate text-sm text-muted-foreground">
                      at{" "}
                      <Link
                        href={`/salons/${review.salon.id}`}
                        className="transition-colors hover:text-foreground"
                      >
                        {review.salon.name}
                      </Link>
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    <time dateTime={review.createdAt}>
                      {MONTH.format(new Date(review.createdAt))}
                    </time>
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
