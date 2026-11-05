"use client";
import { track } from "@/lib/track";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { PendingBar } from "../Shared/PendingRegion";
import { SERVICE_CATEGORIES } from "@/constants/service-categories";
import { cn } from "@/lib/utils";
import type { ApiResponse, SalonArea } from "@/lib/api-types";
import LocationFilter from "./LocationFilter";
import type { ListLocation, ListNoun, SalonSort } from "./types";
import { useSalonsUrl } from "./useSalonsUrl";

const CHIP =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const CHIP_IDLE =
  "border-border bg-surface text-foreground hover:border-primary/40 hover:bg-primary-soft";
const CHIP_SELECTED =
  "border-primary bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover";

export const SORT_LABELS: Record<SalonSort, string> = {
  distance: "Nearest",
  rating: "Top rated",
  newest: "Newest",
};

// Each also lists unisex salons, which serve both.
const AUDIENCE_OPTIONS = [
  { value: null, label: "All" },
  { value: "LADIES", label: "Ladies" },
  { value: "GENTS", label: "Gents" },
] as const;

type AudienceValue = (typeof AUDIENCE_OPTIONS)[number]["value"];

/**
 * The salon list's search, location, sort and service filters. It sticks
 * under the navbar and never waits for the list: every change is a URL
 * navigation, and the results below dim until the new list is ready.
 */
export default function SalonsFilterBar({
  audience: pinnedAudience,
  location,
  areas,
  sort,
  noun,
}: {
  /** The page lists one audience only (the ladies and gents pages): no Ladies / Gents switch. */
  audience?: "LADIES" | "GENTS";
  location: ListLocation;
  areas: Promise<ApiResponse<SalonArea[]>>;
  /** The order the list is in (the default when the URL names none). */
  sort: SalonSort;
  noun: ListNoun;
}) {
  const { searchParams, navigate } = useSalonsUrl();
  const barRef = useRef<HTMLDivElement>(null);
  const chipRowRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState(searchParams.get("searchTerm") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Back/forward changes the URL without remounting: pull the input back in
  // line with it during render rather than in an effect.
  const paramsKey = searchParams.toString();
  const [syncedParams, setSyncedParams] = useState(paramsKey);
  if (syncedParams !== paramsKey) {
    setSyncedParams(paramsKey);
    setSearch(searchParams.get("searchTerm") || "");
  }

  // The results below offset their scroll targets and the sticky map by the
  // bar's height.
  useEffect(() => {
    const bar = barRef.current;
    const holder = bar?.parentElement;
    if (!bar || !holder) return;
    const observer = new ResizeObserver(() =>
      holder.style.setProperty("--salons-bar-h", `${bar.offsetHeight}px`),
    );
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const hasPoint = location.kind === "near";
  const sortOptions: SalonSort[] = hasPoint
    ? ["distance", "rating", "newest"]
    : ["rating", "newest"];

  const category = searchParams.get("category");

  // A service picked in the drawer (or from a shared link) may sit past the
  // edge of the swipeable row: bring its chip into view, without moving the
  // page itself.
  useEffect(() => {
    const row = chipRowRef.current;
    const chip = row?.querySelector<HTMLElement>(
      `[data-category="${category ?? ""}"]`,
    );
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    const left = chip.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + chip.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: Math.max(0, left - 16), behavior: "smooth" });
    }
  }, [category]);

  const audience: AudienceValue = pinnedAudience
    ? null
    : (AUDIENCE_OPTIONS.find((o) => o.value === searchParams.get("audience"))
        ?.value ?? null);

  const submitSearch = (value: string) => {
    track("search_submitted", "source:salons_page");
    navigate({ searchTerm: value.trim() || null });
  };

  // What the phone's Filters button counts: what lives behind it.
  const sheetCount = (category ? 1 : 0) + (audience ? 1 : 0);

  const serviceChips = (
    <>
      <button
        type="button"
        onClick={() => navigate({ category: null })}
        aria-pressed={!category}
        data-category=""
        className={cn(CHIP, category ? CHIP_IDLE : CHIP_SELECTED)}
      >
        All services
      </button>
      {SERVICE_CATEGORIES.map((c) => {
        const Icon = c.icon;
        const selected = category === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => navigate({ category: selected ? null : c.value })}
            aria-pressed={selected}
            data-category={c.value}
            className={cn(CHIP, selected ? CHIP_SELECTED : CHIP_IDLE)}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {c.label}
          </button>
        );
      })}
    </>
  );

  return (
    <div
      ref={barRef}
      className="sticky top-16 z-20 border-b border-border/60 bg-background/95 shadow-[0_1px_0_0_rgb(0_0_0/0.02)] supports-[backdrop-filter]:bg-background/90"
    >
      <div className="container mx-auto space-y-2.5 px-4 py-2.5 sm:px-6 md:space-y-3 md:py-3 lg:px-8">
        {/* Row 1: search; from md also location, sort and Ladies / Gents. */}
        <div className="flex items-center gap-2 md:gap-3">
          <SearchField
            value={search}
            onChange={setSearch}
            onSubmit={submitSearch}
            placeholder="Search by name or service"
          />

          <LocationFilter
            variant="field"
            location={location}
            areas={areas}
            noun={noun}
            className="hidden w-60 shrink-0 md:flex lg:w-72"
          />

          <div className="hidden shrink-0 md:block">
            <Select
              value={sort}
              onValueChange={(value) => navigate({ sort: value })}
            >
              <SelectTrigger
                aria-label={`Sort ${noun.many}`}
                className="w-40 rounded-full border-border bg-surface shadow-none data-[size=default]:h-12 md:data-[size=default]:h-12"
              >
                <span className="text-muted-foreground">Sort:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {sortOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {SORT_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!pinnedAudience && (
            <AudienceSwitch
              value={audience}
              onChange={(value) => navigate({ audience: value })}
              className="hidden lg:inline-flex"
            />
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative size-11 shrink-0 rounded-full md:hidden"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-label={sheetCount ? `Filters, ${sheetCount} set` : "Filters"}
          >
            <SlidersHorizontal aria-hidden="true" />
            {sheetCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {sheetCount}
              </span>
            )}
          </Button>
        </div>

        {/* Row 2, phones: where (left) and in what order (right). Services
            live in the Filters drawer, so the bar stays two short rows. */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <LocationFilter
            variant="chip"
            location={location}
            areas={areas}
            noun={noun}
            className="min-w-0 max-w-[62%]"
          />
          <Select value={sort} onValueChange={(value) => navigate({ sort: value })}>
            <SelectTrigger
              aria-label={`Sort ${noun.many}`}
              className="h-9 shrink-0 gap-1.5 rounded-full border-border bg-surface px-3 text-sm font-medium shadow-none data-[size=default]:h-9 [&>svg:last-child]:size-3.5"
            >
              <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {sortOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {SORT_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Row 2, tablets and up: the services, one swipeable line. */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="relative min-w-0 flex-1">
            <div
              ref={chipRowRef}
              role="group"
              aria-label="Filter by service"
              className="-mr-4 flex items-center gap-2 overflow-x-auto py-0.5 pr-4 [scrollbar-width:none] sm:-mr-6 sm:pr-6 lg:mr-0 lg:pr-0 [&::-webkit-scrollbar]:hidden"
            >
              {!pinnedAudience && (
                <AudienceSwitch
                  value={audience}
                  onChange={(value) => navigate({ audience: value })}
                  className="hidden md:inline-flex lg:hidden"
                />
              )}
              {serviceChips}
            </div>
            {/* A fade at the right edge says the row scrolls. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -right-4 w-10 bg-gradient-to-l from-background to-transparent sm:-right-6 lg:right-0"
            />
          </div>
        </div>
      </div>

      <PendingBar className="absolute inset-x-0 -bottom-px rounded-none" />

      <FiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        category={category}
        audience={audience}
        showAudience={!pinnedAudience}
        onApply={(next) => {
          navigate({
            category: next.category,
            ...(pinnedAudience ? {} : { audience: next.audience }),
          });
          setFiltersOpen(false);
        }}
      />
    </div>
  );
}

function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder: string;
}) {
  return (
    <form
      role="search"
      className="flex h-11 min-w-0 flex-1 items-center gap-1 rounded-full border border-border bg-surface pl-3.5 pr-1 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 md:h-12"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <Search aria-hidden="true" className="size-4.5 shrink-0 text-muted-foreground" />
      <input
        type="search"
        enterKeyHint="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onSubmit("");
          }}
          aria-label="Clear search"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
      <Button type="submit" size="sm" className="hidden h-9 shrink-0 rounded-full px-4 md:inline-flex md:h-10">
        Search
      </Button>
    </form>
  );
}

function AudienceSwitch({
  value,
  onChange,
  className,
}: {
  value: AudienceValue;
  onChange: (value: AudienceValue) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Ladies or gents"
      className={cn(
        "shrink-0 rounded-full border border-border bg-surface p-1",
        className,
      )}
    >
      {AUDIENCE_OPTIONS.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "h-8 cursor-pointer rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-9",
            value === o.value
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type DrawerChoice = {
  category: string | null;
  audience: AudienceValue;
};

/**
 * Phones: the service (and Ladies / Gents on /salons) in one short bottom
 * drawer; sort has its own dropdown in the bar. The picks apply together on
 * "Show results"; dismissing it drops them.
 */
function FiltersDrawer({
  open,
  onOpenChange,
  category,
  audience,
  showAudience,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string | null;
  audience: AudienceValue;
  showAudience: boolean;
  onApply: (choice: DrawerChoice) => void;
}) {
  const current: DrawerChoice = { category, audience };
  const [draft, setDraft] = useState<DrawerChoice>(current);
  // Every open starts from what the list shows now.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(current);
  }

  const pill = (selected: boolean) =>
    cn(
      "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      selected ? CHIP_SELECTED : CHIP_IDLE,
    );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh] data-[vaul-drawer-direction=bottom]:max-h-[85dvh] data-[vaul-drawer-direction=bottom]:rounded-t-3xl">
        <DrawerHeader className="pb-1 text-left">
          <DrawerTitle className="text-base">Filters</DrawerTitle>
          <DrawerDescription className="text-xs">
            Narrow the list, then show the results.
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-3">
          {showAudience && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                For
              </legend>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={draft.audience === o.value}
                    onClick={() => setDraft((d) => ({ ...d, audience: o.value }))}
                    className={pill(draft.audience === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Service
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!draft.category}
                onClick={() => setDraft((d) => ({ ...d, category: null }))}
                className={pill(!draft.category)}
              >
                All services
              </button>
              {SERVICE_CATEGORIES.map((c) => {
                const Icon = c.icon;
                const selected = draft.category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setDraft((d) => ({ ...d, category: selected ? null : c.value }))
                    }
                    className={pill(selected)}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <DrawerFooter className="flex-row gap-2 border-t border-border/70 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setDraft({ category: null, audience: null })
            }
          >
            Reset
          </Button>
          <Button type="button" className="flex-1" onClick={() => onApply(draft)}>
            Show results
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
