"use client";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { PendingBar } from "../Shared/PendingRegion";
import { BANGLADESH_LOCATIONS } from "@/constants/bangladesh-locations";
import { SERVICE_CATEGORIES } from "@/constants/service-categories";
import { cn } from "@/lib/utils";
import { useSalonsUrl } from "./useSalonsUrl";

const ALL_DIVISIONS = BANGLADESH_LOCATIONS.map((d) => d.division).sort();

const CHIP =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11";
const CHIP_IDLE =
  "border-border bg-surface text-foreground hover:border-primary/40 hover:bg-primary-soft";
const CHIP_SELECTED = "border-transparent bg-foreground text-background";

type Place = { division: string; district: string; area: string };

/**
 * The /salons search, area and service filters. It sticks under the navbar
 * and never waits for the list: every change is a URL navigation, and the
 * results below dim until the new list is ready.
 */
export default function SalonsFilterBar() {
  const { searchParams, navigate } = useSalonsUrl();
  const barRef = useRef<HTMLDivElement>(null);

  const placeFromUrl = (): Place => ({
    division: searchParams.get("division") || "",
    district: searchParams.get("district") || "",
    area: searchParams.get("area") || "",
  });

  const [search, setSearch] = useState(searchParams.get("searchTerm") || "");
  const [place, setPlace] = useState<Place>(placeFromUrl);
  // Phones keep the three area selects in a bottom sheet.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Back/forward changes the URL without remounting: pull the inputs back in
  // line with it during render rather than in an effect.
  const paramsKey = searchParams.toString();
  const [syncedParams, setSyncedParams] = useState(paramsKey);
  if (syncedParams !== paramsKey) {
    setSyncedParams(paramsKey);
    setSearch(searchParams.get("searchTerm") || "");
    setPlace(placeFromUrl());
  }

  // The results below offset their scroll targets and the sticky map by the
  // bar's height, which changes as the chips wrap.
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

  const updateUrl = (newDiv: string, newDist: string, newArea: string) => {
    navigate({
      searchTerm: search.trim(),
      division: newDiv,
      district: newDist,
      area: newArea,
    });
  };

  const category = searchParams.get("category");
  const setCategory = (value: string | null) => navigate({ category: value });

  const clearFilters = () => {
    setSearch("");
    setPlace({ division: "", district: "", area: "" });
    navigate({
      searchTerm: null,
      division: null,
      district: null,
      area: null,
      category: null,
    });
  };

  const locationFilterCount = [
    searchParams.get("division"),
    searchParams.get("district"),
    searchParams.get("area"),
  ].filter(Boolean).length;
  const activeFilterCount =
    locationFilterCount +
    [searchParams.get("searchTerm"), category].filter(Boolean).length;

  // Closing the sheet without "Show salons" drops what was picked in it.
  const closeSheet = (apply: boolean) => {
    if (apply) updateUrl(place.division, place.district, place.area);
    else setPlace(placeFromUrl());
    setFiltersOpen(false);
  };

  return (
    <div
      ref={barRef}
      className="sticky top-16 z-20 border-b border-border/60 bg-background/95"
    >
      <div className="container mx-auto space-y-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Row 1: search, and the area selects beside it from md. */}
        <div className="md:grid md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:gap-3">
          <form
            role="search"
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface p-1.5 transition-colors focus-within:border-primary/60"
            onSubmit={(e) => {
              e.preventDefault();
              updateUrl(place.division, place.district, place.area);
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Search salon or service"
                aria-label="Search salons"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-full border-0 bg-transparent pl-10 pr-9 text-base shadow-none focus-visible:ring-0 md:text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button type="submit" className="shrink-0">
              <Search className="sm:hidden" aria-hidden="true" />
              <span className="max-sm:sr-only">Search</span>
            </Button>
          </form>

          <LocationSelects
            place={place}
            onChange={(next) => {
              setPlace(next);
              updateUrl(next.division, next.district, next.area);
            }}
            wrapperClassName="hidden md:block"
            triggerClassName="rounded-full data-[size=default]:h-13 md:data-[size=default]:h-13"
          />
        </div>

        {/* Row 2: the Filters sheet on phones, then the service chips. */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="shrink-0 md:hidden"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal aria-hidden="true" />
            Filters
            {locationFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {locationFilterCount}
              </span>
            )}
          </Button>

          <div
            role="group"
            aria-label="Filter by service"
            className="-mr-4 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5 pr-4 [scrollbar-width:none] sm:-mr-6 sm:pr-6 md:mr-0 md:flex-wrap md:overflow-visible md:pr-0 [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-pressed={!category}
              className={cn(CHIP, category ? CHIP_IDLE : CHIP_SELECTED)}
            >
              All
            </button>
            {SERVICE_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                aria-pressed={category === c.value}
                className={cn(
                  CHIP,
                  category === c.value ? CHIP_SELECTED : CHIP_IDLE,
                )}
              >
                {c.label}
              </button>
            ))}
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="shrink-0 px-2"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      <PendingBar className="absolute inset-x-0 -bottom-px rounded-none" />

      <Sheet
        open={filtersOpen}
        onOpenChange={(open) => (open ? setFiltersOpen(true) : closeSheet(false))}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader>
            <SheetTitle>Filter by area</SheetTitle>
            <SheetDescription>
              Pick a division, then narrow it down to a district and area.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-4">
            <LocationSelects
              place={place}
              onChange={setPlace}
              triggerClassName="data-[size=default]:h-12 md:data-[size=default]:h-12"
            />
          </div>
          <SheetFooter className="flex-row">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPlace({ division: "", district: "", area: "" })}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => closeSheet(true)}
            >
              Show salons
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Division → district → area; picking one clears the levels below it. */
function LocationSelects({
  place,
  onChange,
  wrapperClassName,
  triggerClassName,
}: {
  place: Place;
  onChange: (next: Place) => void;
  wrapperClassName?: string;
  triggerClassName?: string;
}) {
  const { division, district, area } = place;

  const AVAILABLE_DISTRICTS = useMemo(() => {
    if (!division) return [];
    const div = BANGLADESH_LOCATIONS.find((d) => d.division === division);
    return div ? div.districts.map((d) => d.district).sort() : [];
  }, [division]);

  const AVAILABLE_AREAS = useMemo(() => {
    if (!division || !district) return [];
    const div = BANGLADESH_LOCATIONS.find((d) => d.division === division);
    if (!div) return [];
    const dist = div.districts.find((d) => d.district === district);
    return dist ? [...dist.areas].sort() : [];
  }, [division, district]);

  const trigger = cn(
    "w-full border-border bg-surface pl-10 shadow-none",
    triggerClassName,
  );
  const pin = (dim: boolean) => (
    <MapPin
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground",
        dim && "opacity-60",
      )}
    />
  );
  const fromSelect = (value: string) => (value === "all" ? "" : value);

  return (
    <>
      <div className={cn("relative", wrapperClassName)}>
        {pin(false)}
        <Select
          value={division || "all"}
          onValueChange={(value) =>
            onChange({ division: fromSelect(value), district: "", area: "" })
          }
        >
          <SelectTrigger aria-label="Division" className={trigger}>
            <SelectValue placeholder="Select division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All divisions</SelectItem>
            {ALL_DIVISIONS.map((div) => (
              <SelectItem key={div} value={div}>{div}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn("relative", wrapperClassName)}>
        {pin(true)}
        <Select
          value={district || "all"}
          onValueChange={(value) =>
            onChange({ division, district: fromSelect(value), area: "" })
          }
          disabled={!division}
        >
          <SelectTrigger aria-label="District" className={trigger}>
            <SelectValue placeholder="Select district" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All districts</SelectItem>
            {AVAILABLE_DISTRICTS.map((dist) => (
              <SelectItem key={dist} value={dist}>{dist}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn("relative", wrapperClassName)}>
        {pin(true)}
        <Select
          value={area || "all"}
          onValueChange={(value) =>
            onChange({ division, district, area: fromSelect(value) })
          }
          disabled={!district}
        >
          <SelectTrigger aria-label="Area" className={trigger}>
            <SelectValue placeholder="Select area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All areas</SelectItem>
            {AVAILABLE_AREAS.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
