import Link from "next/link";
import { Quote } from "lucide-react";

import { Stars, initials, shortName } from "@/components/Home/RecentReviews";
import { SNAP_ITEM, SNAP_ROW, Section } from "@/components/Shared/Section";
import { cn } from "@/lib/utils";
import { getLadiesParlours, getParlourQuotes } from "./data";
import { SectionHeading } from "./Heading";

const COUNT = 3;

/** Real reviews from the top-rated ladies parlours; left out below three. */
export default async function Reviews() {
  const data = await getLadiesParlours();
  if (!data) return null;
  const quotes = await getParlourQuotes(data.cards, COUNT);
  if (quotes.length < COUNT) return null;

  return (
    <Section labelledBy="ladies-reviews">
      <SectionHeading
        align="center"
        overline="Kind words"
        title="Loved by our customers"
        titleId="ladies-reviews"
        description="Every review comes from a customer after their visit."
      />
      <ul className={SNAP_ROW}>
        {quotes.map((review) => {
          const name = shortName(review.customer?.name);
          return (
            <li
              key={review.id}
              className={cn(
                SNAP_ITEM,
                "flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-8",
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <Stars rating={review.rating} />
                <Quote aria-hidden className="size-8 fill-gold/15 text-gold/40" />
              </div>
              <blockquote className="mt-5 flex-1">
                <p className="line-clamp-5 font-display text-lg leading-relaxed font-medium text-foreground">
                  “{review.comment?.trim()}”
                </p>
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-semibold text-primary-hover ring-1 ring-gold/30"
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
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
