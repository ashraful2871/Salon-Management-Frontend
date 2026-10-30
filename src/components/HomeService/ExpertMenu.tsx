"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Clock, PackageCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { HomeMenuItem } from "@/services/home-service/types";
import { CATEGORY_LABEL, durationText } from "./content";

/**
 * The expert's home menu as a pick list, with a Book bar that follows the
 * reader (fixed at the bottom on phones, sticky beside the menu from lg).
 * Book carries the picks to the booking flow; with none picked it opens the
 * flow on its services step.
 */
export default function ExpertMenu({ expertId, menu }: { expertId: string; menu: HomeMenuItem[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 10 ? p : [...p, id]));

  const chosen = useMemo(() => menu.filter((m) => picked.includes(m.id)), [menu, picked]);
  const totalMinor = chosen.reduce((sum, m) => sum + m.priceMinor, 0);
  const totalMin = chosen.reduce((sum, m) => sum + m.durationMin, 0);
  const href = `/home-service/book?expert=${encodeURIComponent(expertId)}${
    picked.length ? `&items=${picked.map(encodeURIComponent).join(",")}` : ""
  }`;

  const groups = useMemo(() => {
    const byCat = new Map<HomeMenuItem["category"], HomeMenuItem[]>();
    for (const m of menu) byCat.set(m.category, [...(byCat.get(m.category) ?? []), m]);
    return [...byCat.entries()];
  }, [menu]);

  const summary = picked.length
    ? `${picked.length} service${picked.length === 1 ? "" : "s"} · ${durationText(totalMin)}`
    : "Pick services, or choose them next";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-8">
        {groups.map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-3 text-overline font-semibold uppercase tracking-[0.06em] text-primary">
              {CATEGORY_LABEL[category]}
            </h3>
            <ul className="divide-y divide-border/70 rounded-3xl border border-border bg-surface">
              {items.map((m) => {
                const on = picked.includes(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(m.id)}
                      className="flex w-full cursor-pointer items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:p-5"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
                        )}
                      >
                        {on && <Check className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="font-semibold text-foreground">{m.name}</span>
                          <span className="font-semibold text-foreground tabular-nums">{formatBDT(m.priceMinor)}</span>
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="size-4" aria-hidden />
                          {durationText(m.durationMin)}
                        </span>
                        {m.description && (
                          <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{m.description}</span>
                        )}
                        {m.kitNote && (
                          <span className="mt-2 flex gap-1.5 text-sm text-muted-foreground">
                            <PackageCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                            <span>
                              <span className="font-semibold text-foreground">The expert brings:</span> {m.kitNote}
                            </span>
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* From lg: beside the menu. */}
      <aside className="sticky top-24 hidden rounded-3xl border border-border bg-surface p-5 shadow-soft lg:block">
        <p className="text-sm text-muted-foreground">{summary}</p>
        {picked.length > 0 && (
          <p className="mt-1 font-display text-2xl font-semibold text-foreground tabular-nums">{formatBDT(totalMinor)}</p>
        )}
        <Button size="lg" asChild className="mt-4 w-full">
          <Link href={href}>
            Book
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </aside>

      {/* Phones and tablets: a bar over the bottom of the screen, with room left for it below. */}
      <div className="h-20 lg:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-card lg:hidden">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            {picked.length > 0 && (
              <p className="font-semibold text-foreground tabular-nums">{formatBDT(totalMinor)}</p>
            )}
            <p className="truncate text-sm text-muted-foreground">{summary}</p>
          </div>
          <Button size="lg" asChild className="shrink-0">
            <Link href={href}>
              Book
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
