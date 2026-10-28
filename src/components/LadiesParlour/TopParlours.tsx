import Link from "next/link";
import { ArrowRight } from "lucide-react";

import SalonCard from "@/components/Shared/SalonCard";
import { SNAP_ITEM, SNAP_ROW, Section } from "@/components/Shared/Section";
import { SalonCardSkeleton } from "@/components/Shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SEE_ALL } from "./content";
import { getLadiesParlours, topRated } from "./data";
import { SectionHeading } from "./Heading";

const SHOW = 4;
const MIN_CARDS = 3;
const ROW = cn(SNAP_ROW, "lg:grid-cols-4");

function Heading() {
  return (
    <SectionHeading
      overline="Top rated"
      title="Parlours our customers love"
      titleId="ladies-top"
      description="Rated by customers after their visit."
      action={
        <Button variant="outline" asChild className="bg-surface">
          <Link href={SEE_ALL}>
            See all parlours
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      }
    />
  );
}

/** The best-rated ladies-only parlours; left out when there are too few. */
export default async function TopParlours() {
  const data = await getLadiesParlours();
  const cards = topRated(data?.cards ?? [], SHOW, MIN_CARDS);
  if (cards.length < MIN_CARDS) return null;

  return (
    <Section tone="subtle" labelledBy="ladies-top">
      <Heading />
      <ul aria-label="Top rated ladies parlours" className={ROW}>
        {cards.map((card, i) => (
          <li key={card.id} className={SNAP_ITEM}>
            <SalonCard salon={card} index={i} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function TopParloursSkeleton() {
  return (
    <Section tone="subtle" labelledBy="ladies-top">
      <Heading />
      <div aria-busy="true" aria-label="Loading parlours" className={ROW}>
        {Array.from({ length: SHOW }).map((_, i) => (
          <div key={i} className={SNAP_ITEM}>
            <SalonCardSkeleton />
          </div>
        ))}
      </div>
    </Section>
  );
}
