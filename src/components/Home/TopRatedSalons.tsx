import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "../ui/button";
import SalonCard from "../Shared/SalonCard";
import { SNAP_ITEM, SNAP_ROW, Section, SectionHeader } from "../Shared/Section";
import { SalonCardSkeleton } from "../Shared/SkeletonCard";
import { cn } from "@/lib/utils";
import {
  toSalonCardData,
  usableImage,
  type SalonCardData,
} from "@/lib/salon-card";
import { getAllSalon } from "@/services/salon/getAllSalon";
import {
  getPublicSettings,
  type FeaturedSalon,
} from "@/services/settings/getPublicSettings";

// Too few to fill a row reads as broken, so below this the section is left out.
const MIN_CARDS = 3;
const LIMIT = 8;

const ROW_CLASS = cn(SNAP_ROW, "lg:grid-cols-4");

// `content.featuredSalonIds` as cards: the API already dropped non-ACTIVE ones.
const toFeaturedCard = (s: FeaturedSalon): SalonCardData => ({
  id: s.id,
  name: s.name,
  rating: s.rating,
  reviews: s.totalReviews,
  specialty: "Salon",
  location: s.area,
  image: usableImage(s.cover),
  services: [],
  minPriceMinor: null,
  openNow: null,
  distance: undefined,
});

const OVERLINE = "Top rated";
const TITLE = "Salons customers rate highest";

// Top-rated salons when enough have reviews; otherwise the newest ones, so
// the home page always shows a row of real salons, located or not. Featured
// salons (admin Content page) lead the row, labelled; both reads are cookieless.
export default async function TopRatedSalons() {
  const [byRating, settings] = await Promise.all([
    getAllSalon({ sort: "rating", limit: LIMIT }),
    getPublicSettings(),
  ]);
  if (!byRating.success) return null;

  const featured = (settings.success ? (settings.data?.featuredSalons ?? []) : []).map(
    toFeaturedCard,
  );
  const featuredIds = new Set(featured.map((card) => card.id));

  const rated = (byRating.data ?? [])
    .map(toSalonCardData)
    .filter((card) => card.reviews > 0);

  let cards: SalonCardData[];
  let header: { overline: string; title: string; description?: string; href: string };

  if (rated.length >= MIN_CARDS) {
    cards = rated;
    header = {
      overline: OVERLINE,
      title: TITLE,
      description: "Rated by customers after their visit.",
      href: "/salons?sort=rating",
    };
  } else {
    const newest = await getAllSalon({ sort: "newest", limit: LIMIT });
    if (!newest.success) return null;
    cards = (newest.data ?? []).map(toSalonCardData);
    header = { overline: "Just joined", title: "New on SalonKhuji", href: "/salons" };
  }

  if (cards.length < MIN_CARDS) return null;
  cards = cards.filter((card) => !featuredIds.has(card.id));

  return (
    <Section tone="subtle" labelledBy="top-rated-heading">
      <SectionHeader
        overline={header.overline}
        title={header.title}
        titleId="top-rated-heading"
        description={header.description}
        action={
          <Button variant="outline" asChild>
            <Link href={header.href}>
              See all
              <ArrowRight />
            </Link>
          </Button>
        }
      />
      <ul aria-label={header.title} className={ROW_CLASS}>
        {featured.map((card, i) => (
          <li key={card.id} className={SNAP_ITEM}>
            <SalonCard salon={card} index={i} badge="Featured" />
          </li>
        ))}
        {cards.map((card, i) => (
          <li key={card.id} className={SNAP_ITEM}>
            <SalonCard salon={card} index={featured.length + i} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

// Streams in place of the row, so the hero never waits for this read.
export function TopRatedSkeleton() {
  return (
    <Section tone="subtle" labelledBy="top-rated-heading">
      <SectionHeader overline={OVERLINE} title={TITLE} titleId="top-rated-heading" />
      <div aria-busy="true" aria-label="Loading salons" className={ROW_CLASS}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={SNAP_ITEM}>
            <SalonCardSkeleton />
          </div>
        ))}
      </div>
    </Section>
  );
}
