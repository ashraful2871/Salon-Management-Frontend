"use client";

import { useState } from "react";
import { HousePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE } from "@/lib/site";
import type { OwnerHomeProfile } from "@/services/home-service/types";
import { checklistFor, SIDE_LABEL, sideIsOpen, startingSides, type Sides } from "./format";
import { HomeChecklist } from "./HomeChecklist";
import { useTurnOn } from "./useTurnOn";

/** All a branch sees until its owner decides: what Home Service is, and what it takes. */
export function OfferCard({ home }: { home: OwnerHomeProfile }) {
  const { turnOn, pending, failing, checklist } = useTurnOn(home);
  const [sides, setSides] = useState<Sides>(() => startingSides(home));
  const { commissionPercent, enabled } = home.platform;

  return (
    <Card>
      <CardHeader>
        <span className="mb-2 grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
          <HousePlus aria-hidden="true" className="size-5" />
        </span>
        <CardTitle className="text-xl">Offer Home Service?</CardTitle>
        <CardDescription>
          Your verified experts visit customers at home. Customers book and pay through {SITE.name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          {home.allowedSides.includes("LADIES") && <li>Ladies at Home is served by female experts only.</li>}
          <li>The advance is held by {SITE.name} and paid to you after each visit.</li>
          <li>
            Commission: {commissionPercent}%{commissionPercent === 0 && " at launch"}.
          </li>
        </ul>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Which side will you offer?</legend>
          <div className="flex flex-wrap gap-2">
            {home.allowedSides.map((side) => {
              const open = sideIsOpen(home, side);
              const key = side === "LADIES" ? "ladies" : "gents";
              return (
                <label
                  key={side}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={open && sides[key]}
                    disabled={!open || pending}
                    onChange={(e) => setSides((s) => ({ ...s, [key]: e.target.checked }))}
                  />
                  {SIDE_LABEL[side]} at Home
                  {!open && <span className="text-xs text-muted-foreground">Not open yet</span>}
                </label>
              );
            })}
          </div>
        </fieldset>

        <section aria-labelledby="home-checklist" className="space-y-2">
          <h2 id="home-checklist" className="text-sm font-medium">
            Before you turn it on
          </h2>
          <HomeChecklist items={checklistFor(checklist, sides)} salonId={home.salon.id} failing={failing} />
        </section>

        {!enabled && <p className="text-sm text-muted-foreground">{SITE.name} hasn&apos;t opened Home Service yet.</p>}
        <Button
          className="w-full sm:w-auto"
          loading={pending}
          disabled={!enabled || (!sides.ladies && !sides.gents)}
          onClick={() => turnOn(sides)}
        >
          Turn on
        </Button>
      </CardContent>
    </Card>
  );
}
