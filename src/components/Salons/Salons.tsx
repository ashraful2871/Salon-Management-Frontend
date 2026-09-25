"use client";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
  List,
  Map as MapIcon,
  MapPin,
  Search,
} from "lucide-react";
import React, { useMemo, useState, useTransition } from "react";
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

const RADII_KM = [1, 3, 5, 10, 25];
// The backend accepts up to 50 km, so the empty state can widen past 25.
const WIDER_RADII_KM = [...RADII_KM, 50];

const SORT_LABELS: Record<SalonSort, string> = {
  distance: "Nearest",
  rating: "Top rated",
  newest: "Newest",
};

const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

const nearestRadius = (km: number) =>
  RADII_KM.reduce((best, r) =>
    Math.abs(r - km) < Math.abs(best - km) ? r : best,
  );

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
    startTransition(() => router.push(qs ? `/salons?${qs}` : "/salons"));
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

  const setRadius = (km: number) => navigate({ ...pin, r: String(km) });
  const setSort = (value: SalonSort) => navigate({ ...pin, sort: value });
  const showAllSalons = () =>
    navigate({
      lat: null,
      lng: null,
      r: null,
      sort: sort === "distance" ? null : sort,
      near: "off",
    });
  const goToPage = (p: number) =>
    navigate({ page: p > 1 ? String(p) : null }, { keepPage: true });

  const searchArea = ({ lat, lng, halfWidthKm }: SearchArea) => {
    if (!isInBangladesh(lat, lng)) {
      toast.error("Move the map back over Bangladesh to search there.");
      return;
    }
    navigate({
      lat: String(roundCoord(lat)),
      lng: String(roundCoord(lng)),
      r: String(nearestRadius(halfWidthKm)),
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

  const onRadiusKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + RADII_KM.length) % RADII_KM.length;
    const group = e.currentTarget.parentElement;
    group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
    setRadius(RADII_KM[next]);
  };

  /** ✅ Normalize your API data into the same fields your UI already expects */
  const normalizedSalons = useMemo(
    () => (allSalons || []).map(toSalonCardData),
    [allSalons],
  );

  /** ✅ Build categories from your API (still same UI) */
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
  const totalPage = meta?.limit ? Math.max(1, Math.ceil(total / meta.limit)) : 1;
  const widerRadius = nearby
    ? WIDER_RADII_KM.find((km) => km > nearby.radiusKm)
    : undefined;
  const radiusIsPreset = nearby ? RADII_KM.includes(nearby.radiusKm) : false;

  const countText = nearby
    ? `${plural(total, "salon")} within ${nearby.radiusKm} km`
    : `Showing ${plural(total, "salon")}`;

  // Beside the map the list column is narrower, so fewer cards per row.
  const gridClass = nearby
    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
    : "grid md:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <>
      {/* Header */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Discover Salons
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find and book appointments at the best salons near you
            </p>
          </div>

          {/* Search & Filter */}
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            <form
              className="flex flex-col md:flex-row gap-3"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                updateUrl(divisionFilter, districtFilter, areaFilter);
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search salons..."
                  aria-label="Search salons"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 bg-background"
                />
              </div>
              <Button type="submit" className="h-12 px-8">
                Search
              </Button>
            </form>

            {/* Location Filters */}
            <div className="flex flex-col md:flex-row gap-3 mt-2">
              {/* Division */}
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
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
                  <SelectTrigger className="h-12 w-full bg-background pl-12">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Divisions</SelectItem>
                    {ALL_DIVISIONS.map((div) => (
                      <SelectItem key={div} value={div}>{div}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District */}
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none opacity-50" />
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
                  <SelectTrigger className="h-12 w-full bg-background pl-12">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {AVAILABLE_DISTRICTS.map((dist) => (
                      <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area */}
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none opacity-50" />
                <Select
                  value={areaFilter || "all"}
                  onValueChange={(value) => {
                    const newArea = value === "all" ? "" : value;
                    setAreaFilter(newArea);
                    updateUrl(divisionFilter, districtFilter, newArea);
                  }}
                  disabled={!districtFilter}
                >
                  <SelectTrigger className="h-12 w-full bg-background pl-12">
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {AVAILABLE_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-gold"
                      : "bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Salons Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 space-y-3">
            {/* Where the list is measured from */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
              {nearby ? (
                <p className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-gold" />
                  <span className="truncate">
                    Near{" "}
                    <span className="font-semibold text-foreground">
                      {nearby.label}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={() => setLocationOpen(true)}
                    aria-haspopup="dialog"
                    className="shrink-0 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
                  >
                    Change
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  aria-haspopup="dialog"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3.5 py-1.5 font-semibold text-foreground transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <MapPin className="h-4 w-4 text-gold" />
                  Show salons near you
                </button>
              )}
              {nearby && (
                <button
                  type="button"
                  onClick={showAllSalons}
                  className="shrink-0 font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
                >
                  Show all salons
                </button>
              )}
            </div>

            {/* Sort + radius: one scrollable row on phones */}
            <div className="-mx-4 flex items-center gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:justify-between sm:overflow-visible sm:px-0">
              {nearby && (
                <div className="flex shrink-0 items-center gap-2 sm:order-first">
                  <span aria-hidden="true" className="hidden text-sm text-muted-foreground sm:inline">
                    Within:
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Search radius"
                    className="flex items-center gap-2"
                  >
                    {RADII_KM.map((km, index) => {
                      const checked = km === nearby.radiusKm;
                      return (
                        <button
                          key={km}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          tabIndex={checked || (!radiusIsPreset && index === 0) ? 0 : -1}
                          onClick={() => !checked && setRadius(km)}
                          onKeyDown={(e) => onRadiusKeyDown(e, index)}
                          className={cn(
                            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            checked
                              ? "border-primary bg-primary text-primary-foreground shadow-gold"
                              : "bg-background text-muted-foreground hover:border-gold hover:text-foreground",
                          )}
                        >
                          {km} km
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="order-first flex shrink-0 items-center gap-2 sm:order-last">
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  Sort:
                </span>
                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as SalonSort)}
                >
                  <SelectTrigger aria-label="Sort salons" className="h-9 w-[8.5rem] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

            <p
              aria-live="polite"
              className="text-muted-foreground"
            >
              {error ? "" : countText}
            </p>
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
                <div className="mx-auto max-w-md rounded-2xl border bg-muted/40 px-6 py-10 text-center">
                  <MapPin className="mx-auto mb-3 h-8 w-8 text-gold" />
                  <p className="font-semibold text-foreground">
                    No salons within {nearby.radiusKm} km of {nearby.label}.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {widerRadius && (
                      <Button variant="gold" onClick={() => setRadius(widerRadius)}>
                        Search within {widerRadius} km
                      </Button>
                    )}
                    <Button variant="outline" onClick={showAllSalons}>
                      Show all salons
                    </Button>
                  </div>
                </div>
              ) : filteredSalons.length === 0 ? (
                <div className="mx-auto max-w-md rounded-2xl border bg-muted/40 px-6 py-10 text-center">
                  <p className="font-semibold text-foreground">
                    {total === 0
                      ? "No salons match your search."
                      : normalizedSalons.length === 0
                        ? "There are no salons on this page."
                        : `No ${activeCategory} salons on this page.`}
                  </p>
                  {total > 0 && normalizedSalons.length === 0 && (
                    <Button variant="outline" className="mt-4" onClick={() => goToPage(1)}>
                      Go to the first page
                    </Button>
                  )}
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
                          "scroll-mt-24 rounded-xl transition-shadow",
                          showMap &&
                            activeId === salon.id &&
                            "ring-2 ring-gold ring-offset-2 ring-offset-background",
                        )}
                      >
                        <SalonCard
                          salon={salon}
                          index={index}
                          distance={salon.distance}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {!error && totalPage > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-10 flex items-center justify-between gap-4"
                >
                  <Button
                    variant="outline"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || isPending}
                  >
                    <ChevronLeft />
                    Prev
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{page}</span>{" "}
                    of {totalPage}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPage || isPending}
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </nav>
              )}
            </div>

            {showMap && nearby && (
              <div className="h-[calc(100dvh-9rem)] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
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
        <Button
          type="button"
          onClick={toggleMobileView}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full px-5 shadow-lg lg:hidden"
        >
          {mobileView === "map" ? (
            <>
              <List />
              List
            </>
          ) : (
            <>
              <MapIcon />
              Map
            </>
          )}
        </Button>
      )}

      <LocationDialog open={locationOpen} onOpenChange={setLocationOpen} />
    </>
  );
};

export default Salons;
