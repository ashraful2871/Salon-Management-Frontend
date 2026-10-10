"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SalonCard from "@/components/Shared/SalonCard";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { usableImage } from "@/lib/salon-card";
import { searchAdmin } from "@/services/admin/searchAdmin";
import type { AdminSearchHit } from "@/services/admin/types";
import type { AdminFeaturedSalon } from "@/services/admin/content/types";
import { move, RowControls } from "./ContentSection";

export type FeaturedRow = AdminFeaturedSalon;

/** A search hit before the page reloads it with its rating and cover. */
const fromHit = (hit: AdminSearchHit): FeaturedRow => ({
  id: hit.id,
  name: hit.title,
  area: hit.subtitle?.split(" · ")[0] ?? "",
  rating: 0,
  totalReviews: 0,
  cover: null,
  status: hit.status ?? "ACTIVE",
  isDeleted: false,
  isTest: false,
});

const hiddenReason = (row: FeaturedRow) =>
  row.isDeleted || row.status !== "ACTIVE"
    ? `${row.isDeleted ? "Deleted" : row.status.replaceAll("_", " ").toLowerCase()}: not shown`
    : row.isTest
      ? "Test data: not shown on the public site"
      : null;

/** Search ACTIVE salons, keep up to `max` in order, preview them as the home row will. */
export function FeaturedEditor({
  rows,
  max,
  onChange,
}: {
  rows: FeaturedRow[];
  max: number;
  onChange: (rows: FeaturedRow[]) => void;
}) {
  const id = useId();
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<AdminSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const full = rows.length >= max;

  useEffect(() => {
    const q = term.trim();
    // Under two characters the results list is not rendered at all.
    if (q.length < 2) return;
    let live = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchAdmin(q);
      if (!live) return;
      setSearching(false);
      setHits(
        result.success
          ? (result.data ?? []).filter((h) => h.kind === "salon" && h.status === "ACTIVE")
          : [],
      );
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [term]);

  const chosen = new Set(rows.map((r) => r.id));
  const shown = rows.filter((r) => !hiddenReason(r));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${id}-search`}>Add an ACTIVE salon</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={`${id}-search`}
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={full ? `The list is full (${max})` : "Salon name or id"}
            disabled={full}
            className="pl-9"
            autoComplete="off"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
          )}
        </div>
        {term.trim().length >= 2 && !searching && (
          <ul aria-label="Matching salons" className="divide-y rounded-xl border">
            {hits.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-muted-foreground">No ACTIVE salon matches.</li>
            ) : (
              hits.map((hit) => (
                <li key={hit.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{hit.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={full || chosen.has(hit.id)}
                    onClick={() => onChange([...rows, fromHit(hit)])}
                  >
                    <Plus />
                    {chosen.has(hit.id) ? "Added" : "Add"}
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No featured salons: the row shows the top-rated list only.
        </p>
      ) : (
        <ol aria-label="Featured salons, in order" className="divide-y rounded-xl border">
          {rows.map((row, i) => {
            const hidden = hiddenReason(row);
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">{i + 1}.</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{row.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{row.area}</span>
                  </span>
                  {hidden && (
                    <ToneBadge status="hidden" tone="warning">
                      {hidden}
                    </ToneBadge>
                  )}
                </span>
                <RowControls
                  index={i}
                  count={rows.length}
                  label={row.name}
                  disabled={false}
                  onMove={(by) => onChange(move(rows, i, by))}
                  onRemove={() => onChange(rows.filter((r) => r.id !== row.id))}
                />
              </li>
            );
          })}
        </ol>
      )}

      {shown.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Preview (photos and ratings fill in after saving)</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((row, i) => (
              <li key={row.id}>
                <SalonCard
                  index={i}
                  badge="Featured"
                  salon={{
                    id: row.id,
                    name: row.name,
                    rating: row.rating,
                    reviews: row.totalReviews,
                    location: row.area,
                    image: usableImage(row.cover),
                    services: [],
                    openNow: null,
                    minPriceMinor: null,
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
