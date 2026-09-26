"use client";
import { useRouter, useSearchParams } from "next/navigation";

import {
  List,
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BANGLADESH_LOCATIONS } from "@/constants/bangladesh-locations";
import SalonCard from "../Shared/SalonCard";
import { SalonCardSkeleton } from "../Shared/SkeletonCard";
import Pagination from "../Shared/Pagination";
import LocationDialog from "../Location/LocationDialog";
import { SalonsMap, type SearchArea } from "../Map/MapClient";
import { cn } from "@/lib/utils";
import { isInBangladesh, roundCoord } from "@/lib/geo";
import { toSalonCardData } from "@/lib/salon-card";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { PaginationMeta, Salon } from "@/lib/api-types";

export type SalonSort = "distance" | "rating" | "newest";

export type NearbyContext = {
  lat: number;
  lng: number;
  radiusKm: number;
  label: string;
};

const SORT_LABELS: Record<SalonSort, string> = {
  distance: "Nearest",
  rating: "Top rated",
  newest: "Newest",
};

const plural = (n: number, word: string) =>
  `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

// "HAIR COLOR" -> "Hair Color". The filter still matches on the raw value.
const categoryLabel = (value: string) =>
  value === "All"
    ? "All"
    : value
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

const cardId = (salonId: string) => `salon-card-${salonId}`;

type SalonsProps = {
  allSalons: Salon[];
  // The backend sends { page, limit, total }; totalPage is derived here.
  meta?: Pick<PaginationMeta, "page" | "limit" | "total">;
  nearby: NearbyContext | null;
  sort: SalonSort;
  error?: string;
};

const Salons = ({ allSalons, meta, nearby, sort, error }: SalonsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("searchTerm") || "");
  const [divisionFilter, setDivisionFilter] = useState(searchParams.get("division") || "");
  const [districtFilter, setDistrictFilter] = useState(searchParams.get("district") || "");
  const [areaFilter, setAreaFilter] = useState(searchParams.get("area") || "");
  const [activeCategory, setActiveCategory] = useState("All");
  const [locationOpen, setLocationOpen] = useState(false);
  // Phones fold the three location selects away behind a "Filters" button.
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Nearby mode shows a map: beside the list on desktop, behind a Map/List
  // toggle on phones. It is mounted only while on screen, so it costs nothing
  // until then.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const showMap = nearby !== null && (isDesktop || mobileView === "map");
  const mapOnly = showMap && !isDesktop;

  // Back/forward changes the URL without remounting: pull the inputs back in
  // line with it during render rather than in an effect.
  const paramsKey = searchParams.toString();
  const [syncedParams, setSyncedParams] = useState(paramsKey);
  if (syncedParams !== paramsKey) {
    setSyncedParams(paramsKey);
    setSearch(searchParams.get("searchTerm") || "");
    setDivisionFilter(searchParams.get("division") || "");
    setDistrictFilter(searchParams.get("district") || "");
    setAreaFilter(searchParams.get("area") || "");
    setActiveCategory("All");
  }

  const ALL_DIVISIONS = BANGLADESH_LOCATIONS.map((d) => d.division).sort();

  const AVAILABLE_DISTRICTS = useMemo(() => {
    if (!divisionFilter) return [];
    const div = BANGLADESH_LOCATIONS.find((d) => d.division === divisionFilter);
    return div ? div.districts.map((d) => d.district).sort() : [];
  }, [divisionFilter]);

  const AVAILABLE_AREAS = useMemo(() => {
    if (!divisionFilter || !districtFilter) return [];
    const div = BANGLADESH_LOCATIONS.find((d) => d.division === divisionFilter);
    if (!div) return [];
    const dist = div.districts.find((d) => d.district === districtFilter);
    return dist ? [...dist.areas].sort() : [];
  }, [divisionFilter, districtFilter]);

  const scrollToResults = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.getElementById("salon-results-top")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  // Every list change goes through the URL so it can be shared and undone
  // with back. Anything but a page turn starts again from page 1.
  const navigate = (
    changes: Record<string, string | null | undefined>,
    { keepPage = false } = {},
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!keepPage) params.delete("page");
    const qs = params.toString();
    startTransition(() =>
      // A page turn keeps the reader where the list starts rather than
      // throwing them back up to the search box.
      router.push(qs ? `/salons?${qs}` : "/salons", { scroll: !keepPage }),
    );
  };

  const updateUrl = (newDiv: string, newDist: string, newArea: string) => {
    navigate({
      searchTerm: search.trim(),
      division: newDiv,
      district: newDist,
      area: newArea,
    });
  };

  // Keep the point in the URL when tuning a nearby search, so the result is
  // shareable even when it started from the saved cookie.
  const pin = nearby
    ? { lat: String(nearby.lat), lng: String(nearby.lng) }
    : {};

  const setSort = (value: SalonSort) => navigate({ ...pin, sort: value });
  const showAllSalons = () =>
    navigate({
      lat: null,
      lng: null,
      r: null,
      sort: sort === "distance" ? null : sort,
      near: "off",
    });
  const goToPage = (p: number) => {
    navigate({ page: p > 1 ? String(p) : null }, { keepPage: true });
    scrollToResults();
  };

  const clearFilters = () => {
    setSearch("");
    setDivisionFilter("");
    setDistrictFilter("");
    setAreaFilter("");
    navigate({ searchTerm: null, division: null, district: null, area: null });
  };

  // The reach stays NEARBY_RADIUS_KM however far the map is zoomed out; only
  // the point it is measured from moves.
  const searchArea = ({ lat, lng }: SearchArea) => {
    if (!isInBangladesh(lat, lng)) {
      toast.error("Move the map back over Bangladesh to search there.");
      return;
    }
    navigate({
      lat: String(roundCoord(lat)),
      lng: String(roundCoord(lng)),
      r: null,
      near: null,
    });
  };

  // A pin was clicked: bring its card into view (the map may show salons
  // that aren't on this page, which simply have no card to scroll to).
  const showCard = (id: string) => {
    setActiveId(id);
    if (mapOnly) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.getElementById(cardId(id))?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  const toggleMobileView = () => {
    setMobileView((v) => (v === "map" ? "list" : "map"));
    // Start either view from its top rather than mid-page.
    requestAnimationFrame(() =>
      document.getElementById("salon-results")?.scrollIntoView({ block: "start" }),
    );
  };

  const normalizedSalons = useMemo(
    () => (allSalons || []).map(toSalonCardData),
    [allSalons],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    normalizedSalons.forEach((s) => set.add(s.specialty));
    return ["All", ...Array.from(set)];
  }, [normalizedSalons]);

  // The search term is applied by the backend; categories narrow this page.
  const filteredSalons = normalizedSalons.filter(
    (salon) => activeCategory === "All" || salon.specialty === activeCategory,
  );

  const total = meta?.total ?? normalizedSalons.length;
  const page = meta?.page ?? 1;
  const pageSize = meta?.limit ?? normalizedSalons.length;
  const totalPage = meta?.limit ? Math.max(1, Math.ceil(total / meta.limit)) : 1;

  const activeFilterCount = [
    searchParams.get("searchTerm"),
    searchParams.get("division"),
    searchParams.get("district"),
    searchParams.get("area"),
  ].filter(Boolean).length;
  const locationFilterCount = [divisionFilter, districtFilter, areaFilter].filter(
    Boolean,
  ).length;

  const countText = nearby
    ? `${plural(total, "salon")} within ${nearby.radiusKm} km`
    : `${plural(total, "salon")} found`;

  // Beside the map the list column is narrower, so fewer cards per row.
  const gridClass = nearby
    ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
    : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

  const selectTrigger =
    "h-11 w-full rounded-xl border-border/80 bg-background pl-10 text-sm shadow-none";

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-cream/70 via-cream/30 to-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
        />
        <div className="container relative mx-auto px-4 py-8 sm:px-6 md:py-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-dark">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {nearby ? "Near you" : "Bangladesh"}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {nearby ? (
                <>
                  Salons near{" "}
                  <span className="text-gold-dark">
                    {nearby.label.split(",")[0]}
                  </span>
                </>
              ) : (
                "Discover salons"
              )}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Compare ratings, prices and opening hours, then book your slot in
              a few taps.
            </p>
          </div>

          {/* Search */}
          <form
            className="mt-6 flex flex-col gap-2 rounded-2xl border border-border/80 bg-background p-2 shadow-soft sm:flex-row sm:items-center"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              updateUrl(divisionFilter, districtFilter, areaFilter);
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search salon name or service"
                aria-label="Search salons"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 border-0 bg-transparent pl-11 pr-10 text-base shadow-none focus-visible:ring-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex h-12 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3.5 text-left text-sm font-medium text-foreground transition-colors hover:border-gold/50 hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:max-w-[16rem] sm:flex-none"
              >
                <Navigation className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <span className="truncate">
                  {nearby ? nearby.label : "Near me"}
                </span>
              </button>
              <Button
                type="submit"
                variant="gold"
                className="h-12 shrink-0 rounded-xl px-6"
              >
                <Search className="sm:hidden" />
                <span className="max-sm:sr-only">Search</span>
              </Button>
            </div>
          </form>

          {/* Location filters: always shown from md up, folded on phones. */}
          <div className="mt-3 flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="salon-location-filters"
              className={cn(
                "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                filtersOpen || locationFilterCount > 0
                  ? "border-gold/50 bg-gold/10 text-foreground"
                  : "border-border bg-background text-foreground",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Area filters
              {locationFilterCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {locationFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div
            id="salon-location-filters"
            className={cn(
              "mt-3 grid-cols-1 gap-2 md:grid md:grid-cols-3 md:gap-3",
              filtersOpen ? "grid" : "hidden",
            )}
          >
            {/* Division */}
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={divisionFilter || "all"}
                onValueChange={(value) => {
                  const newDiv = value === "all" ? "" : value;
                  setDivisionFilter(newDiv);
                  setDistrictFilter("");
                  setAreaFilter("");
                  updateUrl(newDiv, "", "");
                }}
              >
                <SelectTrigger aria-label="Division" className={selectTrigger}>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All divisions</SelectItem>
                  {ALL_DIVISIONS.map((div) => (
                    <SelectItem key={div} value={div}>{div}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-60" />
              <Select
                value={districtFilter || "all"}
                onValueChange={(value) => {
                  const newDist = value === "all" ? "" : value;
                  setDistrictFilter(newDist);
                  setAreaFilter("");
                  updateUrl(divisionFilter, newDist, "");
                }}
                disabled={!divisionFilter}
              >
                <SelectTrigger aria-label="District" className={selectTrigger}>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts</SelectItem>
                  {AVAILABLE_DISTRICTS.map((dist) => (
                    <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area */}
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-60" />
              <Select
                value={areaFilter || "all"}
                onValueChange={(value) => {
                  const newArea = value === "all" ? "" : value;
                  setAreaFilter(newArea);
                  updateUrl(divisionFilter, districtFilter, newArea);
                }}
                disabled={!districtFilter}
              >
                <SelectTrigger aria-label="Area" className={selectTrigger}>
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  {AVAILABLE_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categories: one scrolling row on phones, wrapped from md up. */}
          {categories.length > 1 && (
            <div
              role="group"
              aria-label="Filter this page by category"
              className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    activeCategory === category
                      ? "border-transparent bg-charcoal text-white shadow-sm"
                      : "border-border/80 bg-background text-muted-foreground hover:border-gold/50 hover:text-foreground",
                  )}
                >
                  {categoryLabel(category)}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-6 md:py-10">
        <div id="salon-results-top" className="container mx-auto scroll-mt-20 px-4 sm:px-6">
          {/* Toolbar: where the list is measured from, its size, its order. */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p aria-live="polite" className="text-lg font-semibold text-foreground">
                {error ? "Salons" : countText}
              </p>
              {nearby ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 py-1 pl-2.5 pr-1 text-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
                    <span className="truncate">
                      Near <span className="font-semibold">{nearby.label}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLocationOpen(true)}
                      aria-haspopup="dialog"
                      className="shrink-0 cursor-pointer rounded-full px-2 py-0.5 text-xs font-semibold text-gold-dark hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Change
                    </button>
                  </span>
                  <button
                    type="button"
                    onClick={showAllSalons}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Show all salons
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  aria-haspopup="dialog"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <Navigation className="h-3.5 w-3.5 text-gold" />
                  Show salons near you
                </button>
              )}
            </div>

            {/* The reach is fixed at NEARBY_RADIUS_KM, so there is no radius to pick. */}
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by</span>
              <Select
                value={sort}
                onValueChange={(value) => setSort(value as SalonSort)}
              >
                <SelectTrigger
                  aria-label="Sort salons"
                  className="h-10 w-[9rem] rounded-xl bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {(nearby
                    ? (["distance", "rating", "newest"] as const)
                    : (["rating", "newest"] as const)
                  ).map((value) => (
                    <SelectItem key={value} value={value}>
                      {SORT_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            id="salon-results"
            className={cn(
              "scroll-mt-20",
              nearby &&
                "lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8",
            )}
          >
            <div className={cn(mapOnly && "hidden")}>
              {isPending ? (
                <div
                  aria-busy="true"
                  aria-label="Loading salons"
                  className={gridClass}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SalonCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="mx-auto max-w-md rounded-2xl border bg-muted/40 px-6 py-10 text-center">
                  <p className="font-semibold text-foreground">
                    We couldn&apos;t load salons.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => startTransition(() => router.refresh())}
                  >
                    Try again
                  </Button>
                </div>
              ) : total === 0 && nearby ? (
                <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gold/40 bg-gold/5 px-6 py-12 text-center">
                  <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gold/15">
                    <MapPin className="h-7 w-7 text-gold" />
                  </span>
                  <p className="font-display text-lg font-semibold text-foreground">
                    No salons within {nearby.radiusKm} km of {nearby.label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a nearby spot on the map, or browse every salon.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button
                      variant="gold"
                      onClick={() => setLocationOpen(true)}
                      aria-haspopup="dialog"
                    >
                      Change location
                    </Button>
                    <Button variant="outline" onClick={showAllSalons}>
                      Show all salons
                    </Button>
                  </div>
                </div>
              ) : filteredSalons.length === 0 ? (
                <div className="mx-auto max-w-md rounded-2xl border border-dashed bg-muted/30 px-6 py-12 text-center">
                  <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted">
                    <SearchX className="h-7 w-7 text-muted-foreground" />
                  </span>
                  <p className="font-display text-lg font-semibold text-foreground">
                    {total === 0
                      ? "No salons match your search"
                      : normalizedSalons.length === 0
                        ? "There are no salons on this page"
                        : `No ${categoryLabel(activeCategory)} salons on this page`}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {total > 0 && normalizedSalons.length === 0 && (
                      <Button variant="outline" onClick={() => goToPage(1)}>
                        Go to the first page
                      </Button>
                    )}
                    {total > 0 && activeCategory !== "All" && (
                      <Button
                        variant="outline"
                        onClick={() => setActiveCategory("All")}
                      >
                        Show all categories
                      </Button>
                    )}
                    {total === 0 && activeFilterCount > 0 && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className={gridClass}>
                  {filteredSalons.map((salon, index) => {
                    // Hovering or focusing a card highlights its pin on the map.
                    const highlight = showMap
                      ? () => setActiveId(salon.id)
                      : undefined;
                    const unhighlight = showMap ? () => setActiveId(null) : undefined;
                    return (
                      <div
                        key={salon.id}
                        id={cardId(salon.id)}
                        onMouseEnter={highlight}
                        onMouseLeave={unhighlight}
                        onFocus={highlight}
                        onBlur={unhighlight}
                        className={cn(
                          "scroll-mt-24 rounded-2xl transition-shadow",
                          showMap &&
                            activeId === salon.id &&
                            "ring-2 ring-gold ring-offset-2 ring-offset-background",
                        )}
                      >
                        <SalonCard
                          salon={salon}
                          index={index}
                          distance={salon.distance}
                          priority={index < 3}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {!error && (
                <Pagination
                  className="mt-10 border-t border-border/60 pt-6"
                  page={page}
                  totalPages={totalPage}
                  onPageChange={goToPage}
                  disabled={isPending}
                  total={total}
                  pageSize={pageSize}
                  itemLabel="salons"
                />
              )}
            </div>

            {showMap && nearby && (
              <div className="h-[calc(100dvh-9rem)] overflow-hidden rounded-2xl border border-border/70 shadow-soft lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
                <SalonsMap
                  className="h-full"
                  origin={[nearby.lat, nearby.lng]}
                  originLabel={nearby.label}
                  radiusKm={nearby.radiusKm}
                  activeId={activeId}
                  onPinClick={showCard}
                  onSearchArea={searchArea}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {nearby && (
        <button
          type="button"
          onClick={toggleMobileView}
          className="fixed bottom-6 left-1/2 z-40 inline-flex h-12 -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-charcoal px-6 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10 transition-transform active:scale-95 lg:hidden"
        >
          {mobileView === "map" ? (
            <>
              <List className="h-4 w-4" />
              Show list
            </>
          ) : (
            <>
              <MapIcon className="h-4 w-4" />
              Show map
            </>
          )}
        </button>
      )}

      <LocationDialog open={locationOpen} onOpenChange={setLocationOpen} />
    </>
  );
};

export default Salons;
