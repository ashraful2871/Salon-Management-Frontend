"use client";
import { track } from "@/lib/track";
import { useRouter } from "next/navigation";

import { List, Map as MapIcon, MapPin, Navigation, SearchX, Store, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { categoryLabel } from "@/constants/service-categories";
import SalonCard from "../Shared/SalonCard";
import Pagination from "../Shared/Pagination";
import { EmptyState } from "../Shared/EmptyState";
import { ErrorState } from "../Shared/ErrorState";
import LocationDialog from "../Location/LocationDialog";
import { SalonsMap, type SearchArea } from "../Map/MapClient";
import { cn } from "@/lib/utils";
import { isInBangladesh, roundCoord } from "@/lib/geo";
import { toSalonCardData } from "@/lib/salon-card";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { PaginationMeta, Salon } from "@/lib/api-types";
import { salonGridClass, type NearbyContext, type SalonSort } from "./types";
import { useSalonsUrl } from "./useSalonsUrl";

const SORT_LABELS: Record<SalonSort, string> = {
  distance: "Nearest",
  rating: "Top rated",
  newest: "Newest",
};

const plural = (n: number, word: string) =>
  `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;

const cardId = (salonId: string) => `salon-card-${salonId}`;

// Scroll targets land below the navbar and the sticky filter bar.
const UNDER_BAR = "scroll-mt-[calc(5rem+var(--salons-bar-h,0px))]";

type SalonsProps = {
  allSalons: Salon[];
  // The backend sends { page, limit, total }; totalPage is derived here.
  meta?: Pick<PaginationMeta, "page" | "limit" | "total">;
  nearby: NearbyContext | null;
  sort: SalonSort;
  error?: string;
};

export default function SalonsResults({
  allSalons,
  meta,
  nearby,
  sort,
  error,
}: SalonsProps) {
  const router = useRouter();
  const { searchParams, navigate, isPending: isNavigating } = useSalonsUrl();
  // The retry below re-renders the route rather than changing the URL.
  const [isRetrying, startRetry] = useTransition();
  const isPending = isNavigating || isRetrying;

  const [locationOpen, setLocationOpen] = useState(false);

  // Nearby mode shows a map: beside the list on desktop, behind a Map/List
  // toggle on phones. It is mounted only while on screen, so it costs nothing
  // until then.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const showMap = nearby !== null && (isDesktop || mobileView === "map");
  const mapOnly = showMap && !isDesktop;

  useEffect(() => {
    track("salon_list_viewed", showMap ? "mode:map" : "mode:list");
  }, [showMap]);

  const scrollToResults = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.getElementById("salon-results-top")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
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

  const clearFilters = () =>
    navigate({
      searchTerm: null,
      division: null,
      district: null,
      area: null,
      category: null,
    });

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

  const salons = useMemo(
    () => (allSalons || []).map(toSalonCardData),
    [allSalons],
  );

  const total = meta?.total ?? salons.length;
  const page = meta?.page ?? 1;
  const pageSize = meta?.limit ?? salons.length;
  const totalPage = meta?.limit ? Math.max(1, Math.ceil(total / meta.limit)) : 1;

  // What the list is narrowed by, most specific first, for the empty state.
  const category = searchParams.get("category");
  const matchTerm =
    searchParams.get("searchTerm") ||
    (category ? categoryLabel(category) : "") ||
    searchParams.get("area") ||
    searchParams.get("district") ||
    searchParams.get("division");

  const countText = nearby
    ? `${plural(total, "salon")} within ${nearby.radiusKm} km`
    : `${plural(total, "salon")} found`;

  const gridClass = salonGridClass(nearby !== null);

  const renderList = () => {
    if (error) {
      return (
        <div
          aria-busy={isRetrying}
          className={cn(isRetrying && "pointer-events-none opacity-60")}
        >
          {/* A retry of the failed read, not a mutation: re-render the route. */}
          <ErrorState
            title="We couldn't load salons"
            message={error}
            onRetry={() => startRetry(() => router.refresh())}
          />
        </div>
      );
    }
    if (total === 0 && matchTerm) {
      return (
        <EmptyState
          icon={SearchX}
          title={`No salons match “${matchTerm}”`}
          description={
            nearby
              ? `Nothing within ${nearby.radiusKm} km of ${nearby.label}. Clear the filters or look further away.`
              : "Try another word or clear the filters to see every salon."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={clearFilters}>Clear filters</Button>
              {nearby && (
                <Button variant="outline" onClick={showAllSalons}>
                  Show all salons
                </Button>
              )}
            </div>
          }
        />
      );
    }
    if (total === 0 && nearby) {
      return (
        <EmptyState
          icon={MapPin}
          title={`No salons within ${nearby.radiusKm} km of ${nearby.label}`}
          description="Try a nearby spot on the map, or browse every salon."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={showAllSalons}>Show all salons</Button>
              <Button
                variant="outline"
                onClick={() => setLocationOpen(true)}
                aria-haspopup="dialog"
              >
                Change location
              </Button>
            </div>
          }
        />
      );
    }
    if (total === 0) {
      return (
        <EmptyState
          icon={Store}
          title="No salons yet"
          description="Salons appear here once they are approved."
        />
      );
    }
    if (salons.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="There are no salons on this page"
          action={
            <Button variant="outline" onClick={() => goToPage(1)}>
              Go to the first page
            </Button>
          }
        />
      );
    }
    return (
      <div className={gridClass}>
        {salons.map((salon, index) => {
          // Hovering or focusing a card highlights its pin on the map.
          const highlight = showMap ? () => setActiveId(salon.id) : undefined;
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
                "rounded-2xl transition-shadow",
                UNDER_BAR,
                showMap &&
                  activeId === salon.id &&
                  "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            >
              <SalonCard
                salon={salon}
                index={index}
                distance={salon.distance}
                preload={index < 3}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Toolbar: where the list is measured from, its size, its order. */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p aria-live="polite" className="text-lg font-semibold text-foreground">
            {error ? "Salons" : countText}
          </p>
          {nearby ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-2.5 pr-1 text-foreground">
                <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">
                  Near <span className="font-semibold">{nearby.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  aria-haspopup="dialog"
                  className="shrink-0 cursor-pointer rounded-full px-2 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Change
                </button>
              </span>
              <Button variant="ghost" size="sm" onClick={showAllSalons}>
                <X aria-hidden="true" />
                Show all salons
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocationOpen(true)}
              aria-haspopup="dialog"
            >
              <Navigation aria-hidden="true" />
              Show salons near you
            </Button>
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
              className="w-36 rounded-xl data-[size=default]:h-10 md:data-[size=default]:h-10"
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
          UNDER_BAR,
          nearby &&
            "lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8",
        )}
      >
        <div className={cn(mapOnly && "hidden")}>
          {renderList()}

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
          <div className="h-[calc(100dvh-7rem-var(--salons-bar-h,0px))] overflow-hidden rounded-2xl border border-border/70 shadow-soft lg:sticky lg:top-[calc(5rem+var(--salons-bar-h,0px))] lg:h-[calc(100vh-6rem-var(--salons-bar-h,0px))]">
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

      {nearby && (
        <button
          type="button"
          onClick={toggleMobileView}
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 inline-flex h-12 -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background shadow-card transition-transform active:scale-95 lg:hidden"
        >
          {mobileView === "map" ? (
            <>
              <List className="size-4" aria-hidden="true" />
              List
            </>
          ) : (
            <>
              <MapIcon className="size-4" aria-hidden="true" />
              Map
            </>
          )}
        </button>
      )}

      <LocationDialog open={locationOpen} onOpenChange={setLocationOpen} />
    </>
  );
}
