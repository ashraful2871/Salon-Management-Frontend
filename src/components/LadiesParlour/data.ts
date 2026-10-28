import { cache } from "react";

import { toSalonCardData, type SalonCardData } from "@/lib/salon-card";
import { getAllSalon } from "@/services/salon/getAllSalon";
import {
  getRecentReviews,
  type RecentReview,
} from "@/services/review/getRecentReviews";

const READ = 16;
const MIN_RATING = 4;
const MIN_COMMENT_LENGTH = 30;

/**
 * Ladies-only parlours, best rated first, and how many there are. The hero,
 * the top-rated row and the reviews all read it; `cache` makes it one
 * request per render.
 */
export const getLadiesParlours = cache(
  async (): Promise<{ cards: SalonCardData[]; total: number } | null> => {
    const res = await getAllSalon({
      audience: "LADIES",
      includeUnisex: false,
      sort: "rating",
      limit: READ,
    });
    if (!res.success) return null;
    // An API that predates includeUnisex sends unisex salons too.
    const own = (res.data ?? []).filter((s) => s.audience === "LADIES");
    return {
      cards: own.map(toSalonCardData),
      total: res.meta?.total ?? own.length,
    };
  },
);

/** Rated parlours first; unrated ones fill in when too few have reviews. */
export function topRated(cards: SalonCardData[], count: number, min: number) {
  const rated = cards.filter((c) => c.reviews > 0);
  return (rated.length >= min ? rated : cards).slice(0, count);
}

/** Up to `count` parlours with a photo, no two sharing the same one. */
export function withDistinctPhotos(cards: SalonCardData[], count: number) {
  const seen = new Set<string>();
  const picked: (SalonCardData & { image: string })[] = [];
  for (const card of cards) {
    if (!card.image || seen.has(card.image)) continue;
    seen.add(card.image);
    picked.push({ ...card, image: card.image });
    if (picked.length === count) break;
  }
  return picked;
}

/**
 * One good review from each of the top-rated parlours: four or better, with
 * something said, the highest rated of its recent ones. Several parlours
 * rather than one, so the quotes vary.
 */
export async function getParlourQuotes(
  cards: SalonCardData[],
  count = 3,
): Promise<RecentReview[]> {
  const parlours = cards.filter((c) => c.reviews > 0).slice(0, count + 1);
  const results = await Promise.all(
    parlours.map((p) => getRecentReviews(6, p.id)),
  );

  const quotes: RecentReview[] = [];
  results.forEach((res, i) => {
    if (!res.success || !Array.isArray(res.data)) return;
    const [best] = res.data
      .filter(
        (r) =>
          r.rating >= MIN_RATING &&
          (r.comment?.trim().length ?? 0) >= MIN_COMMENT_LENGTH,
      )
      .sort((a, b) => b.rating - a.rating);
    if (best) {
      quotes.push({
        ...best,
        salon: best.salon ?? { id: parlours[i].id, name: parlours[i].name },
      });
    }
  });
  return quotes.slice(0, count);
}
