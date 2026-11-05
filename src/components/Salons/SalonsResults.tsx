"use client";
import { track } from "@/lib/track";
import { useRouter } from "next/navigation";

import {
  List,
  Map as MapIcon,
  MapPin,
  Navigation,
  SearchX,
  Store,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { categoryLabel } from "@/constants/service-categories";
import SalonCard from "../Shared/SalonCard";
import Pagination from "../Shared/Pagination";
import { EmptyState } from "../Shared/EmptyState";
import { ErrorState } from "../Shared/ErrorState";
import LocationDialog from "../Location/LocationDialog";
import { SalonsMap, type SearchArea } from "../Map/MapClient";
import { cn } from "@/lib/utils";
import { isInBangladesh } from "@/lib/geo";
import { toSalonCardData } from "@/lib/salon-card";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type {
  Bbox,
  PaginationMeta,
  Salon,
  SalonMarkerFilters,
} from "@/lib/api-types";
import {
  SALON_NOUN,
  locationName,
  salonGridClass,
  type ListLocation,
  type ListNoun,
  type NearbyContext,
} from "./types";
import { useSalonsUrl } from "./useSalonsUrl";

const countOf = (n: number, noun: ListNoun) =>
  `${n.toLocaleString("en-US")} ${n === 1 ? noun.one : noun.many}`;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const cardId = (salonId: string) => `salon-card-${salonId}`;

// Scroll targets land below the navbar and the sticky filter bar.
const UNDER_BAR = "scroll-mt-[calc(5rem+var(--salons-bar-h,0px))]";

type SalonsProps = {
  allSalons: Salon[];
  // The backend sends { page, limit, total }; totalPage is derived here.
  meta?: Pick<PaginationMeta, "page" | "limit" | "total">;
  location: ListLocation;
  nearby: NearbyContext | null;
  /** What the map frames first when there is no point: the area's (or every area's) pins. */
  frame: Bbox | null;
  /** The list's filters, which the map's pins follow. */
  mapFilters: SalonMarkerFilters;
  error?: string;
  noun?: ListNoun;
  /** /salons only: the Ladies / Gents filter is a removable chip. */
  showAudience?: boolean;
};

export default function SalonsResults({
  allSalons,
  meta,
  location,
  nearby,
  frame,
  mapFilters,
  error,
  noun = SALON_NOUN,
  showAudience = false,
}: SalonsProps) {
  const router = useRouter();
  const {
    searchParams,
    navigate,
    location: go,
    isPending: isNavigating,
  } = useSalonsUrl();
  // The retry below re-renders the route rather than changing the URL.
  const [isRetrying, startRetry] = useTransition();
  const isPending = isNavigating || isRetrying;

  const [locationOpen, setLocationOpen] = useState(false);

  // The map sits beside the list on desktop and behind a Map/List switch on
  // phones. It opens by itself on desktop once the list is about a place
  // (an area or a point); "all areas" starts as a wider grid. It is mounted
  // only while on screen, so it costs nothing until then.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const placeBound = location.kind !== "all";
  const [desktopMap, setDesktopMap] = useState<boolean | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const showMap = isDesktop
    ? (desktopMap ?? placeBound)
    : mobileView === "map";
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

  const goToPage = (p: number) => {
    navigate({ page: p > 1 ? String(p) : null }, { keepPage: true });
    scrollToResults();
  };

  const filterKeys = {
    searchTerm: null,
    category: null,
    ...(showAudience ? { audience: null } : {}),
  };
  const clearFilters = () => navigate(filterKeys);
  const showEverything = () => go.all();

  // The reach stays NEARBY_RADIUS_KM however far the map is zoomed out; only
  // the point it is measured from moves.
  const searchArea = ({ lat, lng }: SearchArea) => {
    if (!isInBangladesh(lat, lng)) {
      toast.error("Move the map back over Bangladesh to search there.");
      return;
    }
    go.near(lat, lng);
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

  const category = searchParams.get("category");
  const searchTerm = searchParams.get("searchTerm");
  const audience = showAudience ? searchParams.get("audience") : null;
  const place = locationName(location);
  const hasFilters = Boolean(category || searchTerm || audience);

  const countText = nearby
    ? `${countOf(total, noun)} within ${nearby.radiusKm} km`
    : place
      ? `${countOf(total, noun)} in ${place}`
      : `${countOf(total, noun)} found`;
  const showAllLabel = `Show all ${noun.many}`;
  const placeLabel = nearby ? nearby.label : place;

  // Removable chips for what narrows the list, so each can go on its own.
  const chips: { key: string; label: ReactNode; onRemove: () => void }[] = [];
  if (location.kind !== "all" || place) {
    chips.push({
      key: "location",
      label: (
        <>
          {nearby ? (
            <Navigation className="size-3.5 text-primary" aria-hidden="true" />
          ) : (
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
          )}
          {nearby ? `Near ${nearby.label.split(",")[0]}` : place}
        </>
      ),
      onRemove: showEverything,
    });
  }
  if (searchTerm)
    chips.push({
      key: "search",
      label: `“${searchTerm}”`,
      onRemove: () => navigate({ searchTerm: null }),
    });
  if (category)
    chips.push({
      key: "category",
      label: categoryLabel(category),
      onRemove: () => navigate({ category: null }),
    });
  if (audience)
    chips.push({
      key: "audience",
      label: audience === "LADIES" ? "Ladies" : "Gents",
      onRemove: () => navigate({ audience: null }),
    });

  const gridClass = salonGridClass(showMap && isDesktop);

  const renderList = () => {
    if (error) {
      return (
        <div
          aria-busy={isRetrying}
          className={cn(isRetrying && "pointer-events-none opacity-60")}
        >
          {/* A retry of the failed read, not a mutation: re-render the route. */}
          <ErrorState
            title={`We couldn't load ${noun.many}`}
            message={error}
            onRetry={() => startRetry(() => router.refresh())}
          />
        </div>
      );
    }
    if (total === 0 && hasFilters) {
      const what = searchTerm || (category ? categoryLabel(category) : "") || "these filters";
      return (
        <EmptyState
          icon={SearchX}
          title={`No ${noun.many} match “${what}”${placeLabel ? ` ${nearby ? "near" : "in"} ${placeLabel.split(",")[0]}` : ""}`}
          description={
            placeLabel
              ? `Clear the filters, or look in every area.`
              : `Try another word or clear the filters to see every ${noun.one}.`
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={clearFilters}>Clear filters</Button>
              {placeLabel && (
                <Button variant="outline" onClick={showEverything}>
                  {showAllLabel}
                </Button>
              )}
            </div>
          }
        />
      );
    }
    if (total === 0 && placeLabel) {
      return (
        <EmptyState
          icon={MapPin}
          title={
            nearby
              ? `No ${noun.many} within ${nearby.radiusKm} km of ${nearby.label}`
              : `No ${noun.many} in ${placeLabel} yet`
          }
          description={`Try a nearby spot on the map, or browse every ${noun.one}.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={showEverything}>{showAllLabel}</Button>
              <Button
                variant="outline"
                onClick={() => setLocationOpen(true)}
                aria-haspopup="dialog"
              >
                Pick on map
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
          title={`No ${noun.many} yet`}
          description={`${capitalize(noun.many)} appear here once they are approved.`}
        />
      );
    }
    if (salons.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title={`There are no ${noun.many} on this page`}
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
      {/* Toolbar: the count, what narrows it, and the map switch. */}
      <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2.5">
          <p
            aria-live="polite"
            className="text-base font-semibold text-foreground md:text-lg"
          >
            {error ? capitalize(noun.many) : countText}
          </p>
          {chips.length > 0 && (
            <ul
              aria-label="Active filters"
              className={cn(
                "flex-wrap items-center gap-2",
                // Phones show the location as a chip in the bar already.
                chips.every((c) => c.key === "location")
                  ? "hidden md:flex"
                  : "flex",
              )}
            >
              {chips.map((chip) => (
                <li
                  key={chip.key}
                  className={cn(chip.key === "location" && "hidden md:block")}
                >
                  <span className="inline-flex h-8 max-w-[16rem] items-center gap-1.5 rounded-full border border-border bg-surface pl-3 pr-1 text-sm text-foreground">
                    <span className="flex min-w-0 items-center gap-1.5 truncate">
                      {chip.label}
                    </span>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      aria-label="Remove filter"
                      className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                </li>
              ))}
              {chips.length > 1 && (
                <li>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-8 px-1.5"
                    onClick={() =>
                      location.kind !== "all" || place
                        ? go.all(filterKeys)
                        : clearFilters()
                    }
                  >
                    Clear all
                  </Button>
                </li>
              )}
            </ul>
          )}
        </div>

        {isDesktop && (
          <Button
            type="button"
            variant="outline"
            className="hidden shrink-0 rounded-full lg:inline-flex"
            onClick={() => setDesktopMap(!showMap)}
            aria-pressed={showMap}
          >
            {showMap ? (
              <>
                <List aria-hidden="true" />
                Hide map
              </>
            ) : (
              <>
                <MapIcon aria-hidden="true" />
                Show map
              </>
            )}
          </Button>
        )}
      </div>

      <div
        id="salon-results"
        className={cn(
          UNDER_BAR,
          showMap &&
            isDesktop &&
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
              itemLabel={noun.many}
            />
          )}
        </div>

        {showMap && (
          // The map fills the box absolutely, so it never collapses to 0 when
          // the box's height comes from min-height rather than height.
          <div className="relative h-[calc(100dvh-9rem-var(--salons-bar-h,0px))] min-h-80 overflow-hidden rounded-2xl border border-border/70 shadow-soft lg:sticky lg:top-[calc(5rem+var(--salons-bar-h,0px))] lg:h-[calc(100vh-6rem-var(--salons-bar-h,0px))]">
            <SalonsMap
              className="absolute inset-0"
              origin={nearby ? [nearby.lat, nearby.lng] : null}
              originLabel={nearby?.label}
              radiusKm={nearby?.radiusKm}
              frame={frame}
              filters={mapFilters}
              activeId={activeId}
              onPinClick={showCard}
              onSearchArea={searchArea}
            />
          </div>
        )}
      </div>

      {/* Phones: one switch between the list and the map. */}
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

      <LocationDialog
        open={locationOpen}
        onOpenChange={setLocationOpen}
        initialStep="map"
        onSaved={(loc) => go.near(loc.lat, loc.lng)}
      />
    </>
  );
}
