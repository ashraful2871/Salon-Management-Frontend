import { ArrowRight, House } from "lucide-react";

import type { Salon } from "@/lib/api-types";
import { SIDES } from "./content";
import { SideLink } from "./HomeTrack";

/** On a salon's page when the branch can be booked for Home Service (`salon.homeService`). */
export default function SalonHomeBand({ sides }: { sides: NonNullable<Salon["homeService"]> }) {
  const audiences = (["LADIES", "GENTS"] as const).filter((a) => (a === "LADIES" ? sides.ladies : sides.gents));
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-gold/25 bg-primary-soft p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-primary-hover">
          <House className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-display font-semibold text-foreground">This salon also comes to your home</p>
          <p className="text-sm text-muted-foreground">
            {sides.ladies ? "Female, ID-verified experts for ladies. " : ""}Pay part now, the rest at home.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {audiences.map((a) => (
          <SideLink
            key={a}
            audience={a}
            href={SIDES[a].href}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SIDES[a].title}
            <ArrowRight className="size-4" aria-hidden />
          </SideLink>
        ))}
      </div>
    </div>
  );
}
