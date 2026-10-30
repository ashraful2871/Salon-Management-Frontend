"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, MapPin, UsersRound } from "lucide-react";

import LocationDialog from "@/components/Location/LocationDialog";
import Pagination from "@/components/Shared/Pagination";
import { Button } from "@/components/ui/button";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";
import type { HomeCategory, HomeExpertSort } from "@/services/home-service/types";
import { CATEGORY_ICON, CATEGORY_LABEL, SORT_LABEL } from "./content";

export type HomeView = "service" | "expert";

/** The list's URL as every control changes it; anything but a page turn drops `page`. */
function useHomeUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { navigate: push } = useFilterNavigation();

  const navigate = (changes: Record<string, string | null>, { keepPage = false } = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!keepPage) params.delete("page");
    const qs = params.toString();
    push(qs ? `${pathname}?${qs}` : pathname, { scroll: keepPage });
  };

  return navigate;
}

const pill = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-surface text-foreground/80 hover:border-primary/40 hover:bg-primary-soft",
  );

/** Where the list searches from, with a button that opens the location dialog. */
export function HomeLocationBar({ label, autoOpen = false }: { label: string | null; autoOpen?: boolean }) {
  // Without a point the list has nothing to show: ask on arrival.
  const [open, setOpen] = useState(autoOpen);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <MapPin aria-hidden className={cn("size-4 shrink-0", label ? "text-primary" : "text-muted-foreground")} />
      <p className="min-w-0 truncate text-sm text-muted-foreground">
        {label ? (
          <>
            Experts who come to <span className="font-semibold text-foreground">{label}</span>
          </>
        ) : (
          "Set your location to see who comes to you"
        )}
      </p>
      <Button variant="link" size="sm" onClick={() => setOpen(true)} className="shrink-0">
        {label ? "Change" : "Set location"}
      </Button>
      <LocationDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

/** A plain "change location" button for empty states. */
export function ChangeLocationButton({ children = "Change location" }: { children?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MapPin aria-hidden />
        {children}
      </Button>
      <LocationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

const VIEWS = [
  { value: "service", label: "By service", icon: LayoutGrid },
  { value: "expert", label: "By expert", icon: UsersRound },
] as const;

/** By service | By expert, and the expert sort. */
export function HomeViewControls({ view, sort }: { view: HomeView; sort: HomeExpertSort }) {
  const navigate = useHomeUrl();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="group" aria-label="Show" className="grid grid-cols-2 rounded-full border border-border bg-muted/70 p-1 sm:inline-grid">
        {VIEWS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => navigate({ view: value === "service" ? null : value })}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10",
              view === value ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {view === "expert" && (
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">Sort</span>
          <div role="group" aria-label="Sort experts" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {(Object.keys(SORT_LABEL) as HomeExpertSort[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sort === s}
                onClick={() => navigate({ sort: s === "rating" ? null : s })}
                className={cn(pill(sort === s), "h-8 px-3 pointer-coarse:h-9")}
              >
                {SORT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * "All" plus the categories that reach this point. Each chip counts what the
 * grid below lists: services in the service view, experts in the expert view.
 */
export function HomeCategoryChips({
  view,
  categories,
  totals,
  active,
}: {
  view: HomeView;
  categories: Array<{ category: HomeCategory; count: number; expertCount: number }>;
  totals: { services: number; experts: number };
  active?: HomeCategory;
}) {
  const navigate = useHomeUrl();
  if (!categories.length) return null;
  const noun = view === "expert" ? "expert" : "service";
  const chips = [
    { key: null, label: "All", icon: null, n: view === "expert" ? totals.experts : totals.services },
    ...categories.map((c) => ({
      key: c.category,
      label: CATEGORY_LABEL[c.category],
      icon: CATEGORY_ICON[c.category],
      n: view === "expert" ? c.expertCount : c.count,
    })),
  ];
  return (
    <div
      role="group"
      aria-label={`Categories, counted in ${noun}s`}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {chips.map((c) => {
        const on = (active ?? null) === c.key;
        return (
          <button
            key={c.key ?? "all"}
            type="button"
            aria-pressed={on}
            aria-label={`${c.label}: ${c.n} ${noun}${c.n === 1 ? "" : "s"}`}
            onClick={() => navigate({ category: c.key })}
            className={pill(on)}
          >
            {c.icon && <c.icon aria-hidden className="size-4" />}
            {c.label}
            <span
              className={cn(
                "min-w-6 rounded-full px-1.5 py-px text-center text-xs font-semibold tabular-nums",
                on ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
              )}
            >
              {c.n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function HomePagination({ page, total, pageSize }: { page: number; total: number; pageSize: number }) {
  const navigate = useHomeUrl();
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <Pagination
      className="mt-10 border-t border-border/60 pt-6"
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      itemLabel="experts"
      onPageChange={(p) => navigate({ page: p > 1 ? String(p) : null }, { keepPage: true })}
    />
  );
}
