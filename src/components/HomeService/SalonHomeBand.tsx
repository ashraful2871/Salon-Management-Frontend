import Link from "next/link";
import { ArrowRight, House } from "lucide-react";

import type { Salon } from "@/lib/api-types";

/**
 * On a salon's page when the branch can be booked for Home Service
 * (`salon.homeService`). `onBook` opens the salon's booking dialog on "At
 * home" with this branch's own menu; without it (e.g. bookings paused) only
 * a link to how Home Service works remains: home visits are booked only here.
 */
export default function SalonHomeBand({
  sides,
  onBook,
}: {
  sides: NonNullable<Salon["homeService"]>;
  onBook?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gold/25 bg-primary-soft p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-primary-hover">
          <House className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-display font-semibold text-foreground">This salon also comes to your home</p>
          <p className="text-sm text-muted-foreground">
            {sides.ladies ? "Female, ID-verified experts for ladies. " : ""}Pay an advance now, the rest at home.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {onBook ? (
          <button
            type="button"
            onClick={onBook}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Book a home visit
            <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <Link
            href="/home-service"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            How Home Service works
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
