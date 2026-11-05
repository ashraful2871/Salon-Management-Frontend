"use client";
import {
  Check,
  ChevronDown,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import {
  Suspense,
  use,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { Skeleton } from "../ui/skeleton";
import LocationDialog from "../Location/LocationDialog";
import { useLocateAndSave } from "@/hooks/useLocateAndSave";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import {
  DHAKA_CENTER,
  NEARBY_RADIUS_KM,
  isInBangladesh,
  shortPlaceLabel,
} from "@/lib/geo";
import { saveLocation } from "@/lib/location-cookie";
import { cn } from "@/lib/utils";
import type { ApiResponse, GeoPlace, SalonArea } from "@/lib/api-types";
import { searchPlaces } from "@/services/geo/searchPlaces";
import { locationName, type ListLocation, type ListNoun } from "./types";
import { useSalonsUrl } from "./useSalonsUrl";

const PLACE_DEBOUNCE_MS = 350;
const PLACE_MIN_CHARS = 3;

const norm = (s: string) => s.trim().toLowerCase();

type Props = {
  location: ListLocation;
  areas: Promise<ApiResponse<SalonArea[]>>;
  noun: ListNoun;
  /** "field": the desktop bar's select-like button with a popover. "chip": the phone row's chip with a bottom drawer. */
  variant: "field" | "chip";
  className?: string;
};

/**
 * Where the list looks: every area, one real area (from the salons
 * themselves, with counts), or within NEARBY_RADIUS_KM of a point found by
 * GPS, a place search or a pin on the map. Every pick is a URL change, so it
 * shares and undoes like the other filters.
 */
export default function LocationFilter({
  location,
  areas,
  noun,
  variant,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const { location: go } = useSalonsUrl();

  const name = locationName(location);
  const label =
    location.kind === "near"
      ? name
        ? `Near ${name}`
        : location.fromCookie
          ? "Near you"
          : "Near pinned spot"
      : (name ?? "All areas");
  const isSet = location.kind !== "all" || name !== null;

  const panel = (
    <LocationPanel
      location={location}
      areas={areas}
      noun={noun}
      autoFocus={variant === "field"}
      onClose={() => setOpen(false)}
      onPickOnMap={() => {
        setOpen(false);
        setMapOpen(true);
      }}
    />
  );

  const dialog = (
    <LocationDialog
      open={mapOpen}
      onOpenChange={setMapOpen}
      initialStep="map"
      onSaved={(loc) => go.near(loc.lat, loc.lng)}
    />
  );

  if (variant === "chip") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`Location: ${label}. Change`}
          className={cn(
            "inline-flex h-9 max-w-[13rem] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isSet
              ? "border-primary/30 bg-primary-soft text-foreground"
              : "border-border bg-surface text-foreground",
            className,
          )}
        >
          {location.kind === "near" ? (
            <Navigation className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <span className="truncate">{label}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[85dvh] data-[vaul-drawer-direction=bottom]:max-h-[85dvh] data-[vaul-drawer-direction=bottom]:rounded-t-3xl">
            <DrawerHeader className="pb-2 text-left">
              <DrawerTitle className="text-base">Location</DrawerTitle>
              <DrawerDescription className="text-xs">
                Pick an area, or search around a place.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
              {open && panel}
            </div>
          </DrawerContent>
        </Drawer>
        {dialog}
      </>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group flex h-12 min-w-0 cursor-pointer items-center gap-2.5 rounded-full border border-border bg-surface pl-4 pr-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:border-primary/60",
              className,
            )}
          >
            {location.kind === "near" ? (
              <Navigation className="size-4 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </span>
              <span className="block truncate text-sm font-semibold text-foreground">
                {label}
              </span>
            </span>
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="flex max-h-[min(34rem,calc(100dvh-9rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl p-0 shadow-card"
        >
          {panel}
        </PopoverContent>
      </Popover>
      {dialog}
    </>
  );
}

function LocationPanel({
  location,
  areas,
  noun,
  autoFocus,
  onClose,
  onPickOnMap,
}: {
  location: ListLocation;
  areas: Promise<ApiResponse<SalonArea[]>>;
  noun: ListNoun;
  autoFocus: boolean;
  onClose: () => void;
  onPickOnMap: () => void;
}) {
  const { location: go } = useSalonsUrl();
  const saved = useSavedLocation();
  const gps = useLocateAndSave();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [gpsFailed, setGpsFailed] = useState(false);
  const places = usePlaceSearch(query, saved);

  const pick = (run: () => void) => {
    run();
    onClose();
  };

  const useGps = async () => {
    setGpsFailed(false);
    const stored = gps.canAsk ? await gps.locate() : null;
    if (!stored) {
      setGpsFailed(true);
      return;
    }
    pick(() => go.near(stored.lat, stored.lng));
  };

  const pickPlace = (place: GeoPlace) => {
    const stored = saveLocation({
      lat: place.lat,
      lng: place.lng,
      label: shortPlaceLabel(place),
      source: "search",
    });
    if (stored) pick(() => go.near(stored.lat, stored.lng));
  };

  const nearSaved =
    saved &&
    !(
      location.kind === "near" &&
      location.lat === saved.lat &&
      location.lng === saved.lng
    )
      ? saved
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-border/70 p-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus={autoFocus}
            placeholder="Search area, road or landmark"
            aria-label="Search area, road or landmark"
            className="h-11 w-full rounded-xl border border-border bg-surface-subtle pl-9 pr-9 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:bg-surface md:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction
            onClick={useGps}
            disabled={gps.busy}
            icon={
              gps.busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LocateFixed className="size-4" />
              )
            }
          >
            {gps.busy ? "Finding you…" : "Use my location"}
          </QuickAction>
          <QuickAction onClick={onPickOnMap} icon={<MapIcon className="size-4" />}>
            Pick on map
          </QuickAction>
        </div>
        {gpsFailed && (
          <p role="status" className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-foreground">
            We couldn&apos;t get your location. Search a place or pick it on the map instead.
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
        {nearSaved && !query && (
          <Option
            selected={false}
            onClick={() => pick(() => go.near(nearSaved.lat, nearSaved.lng))}
            icon={<Navigation className="size-4" />}
            title={`Near ${nearSaved.label.split(",")[0]}`}
            hint={`Your saved location · within ${NEARBY_RADIUS_KM} km`}
          />
        )}

        <Suspense fallback={<AreaSkeleton />}>
          <AreaOptions
            areas={areas}
            query={deferredQuery}
            location={location}
            noun={noun}
            onAll={() => pick(go.all)}
            onArea={(a) => pick(() => go.area(a.area, a.district))}
          />
        </Suspense>

        {query.trim().length >= PLACE_MIN_CHARS && (
          <section aria-label="Places" className="mt-1 border-t border-border/70 pt-1">
            <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Places · search {NEARBY_RADIUS_KM} km around
            </p>
            {places.status === "loading" && (
              <p className="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Searching places…
              </p>
            )}
            {places.status === "error" && (
              <p className="px-2.5 py-2 text-sm text-muted-foreground">
                Place search is unavailable. Pick an area above or use the map.
              </p>
            )}
            {places.status === "done" && places.results.length === 0 && (
              <p className="px-2.5 py-2 text-sm text-muted-foreground">
                No places match “{query.trim()}”.
              </p>
            )}
            {places.results.map((p) => (
              <Option
                key={`${p.lat},${p.lng}`}
                selected={false}
                onClick={() => pickPlace(p)}
                icon={<Navigation className="size-4" />}
                title={shortPlaceLabel(p)}
                hint={p.label}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function AreaOptions({
  areas,
  query,
  location,
  noun,
  onAll,
  onArea,
}: {
  areas: Promise<ApiResponse<SalonArea[]>>;
  query: string;
  location: ListLocation;
  noun: ListNoun;
  onAll: () => void;
  onArea: (area: SalonArea) => void;
}) {
  const res = use(areas);
  const list = useMemo(() => (res.success ? (res.data ?? []) : []), [res]);
  const total = useMemo(() => list.reduce((n, a) => n + a.count, 0), [list]);

  // Names that start with the text come first, then the rest that contain it.
  const q = norm(query);
  const shown = useMemo(() => {
    if (!q) return list;
    const starts: SalonArea[] = [];
    const contains: SalonArea[] = [];
    for (const a of list) {
      const n = norm(a.area);
      if (n.startsWith(q)) starts.push(a);
      else if (n.includes(q) || norm(a.district).startsWith(q)) contains.push(a);
    }
    return [...starts, ...contains];
  }, [list, q]);

  const selectedArea = location.kind === "area" ? norm(location.area) : null;
  const allSelected = location.kind === "all" && !locationName(location);

  if (!res.success) {
    return (
      <p className="px-2.5 py-3 text-sm text-muted-foreground">
        Areas couldn&apos;t load. You can still search a place or use the map.
      </p>
    );
  }

  return (
    <section aria-label="Areas">
      {!q && (
        <Option
          selected={allSelected}
          onClick={onAll}
          icon={<MapPin className="size-4" />}
          title="All areas"
          count={total}
        />
      )}
      <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {q ? "Matching areas" : `Areas with ${noun.many}`}
      </p>
      {shown.length === 0 ? (
        <p className="px-2.5 py-2 text-sm text-muted-foreground">
          {q ? `No area with ${noun.many} matches “${query.trim()}”.` : `No ${noun.many} listed yet.`}
        </p>
      ) : (
        shown.map((a) => (
          <Option
            key={`${a.district}|${a.area}`}
            selected={selectedArea === norm(a.area)}
            onClick={() => onArea(a)}
            icon={<MapPin className="size-4" />}
            title={a.area}
            hint={a.district !== a.area ? a.district : undefined}
            count={a.count}
          />
        ))
      )}
    </section>
  );
}

function Option({
  selected,
  onClick,
  icon,
  title,
  hint,
  count,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  hint?: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "bg-primary-soft" : "hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full",
          selected ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {selected ? <Check className="size-4" /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{title}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
      {count != null && (
        <span className="shrink-0 rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
          {count.toLocaleString("en-US")}
        </span>
      )}
    </button>
  );
}

function QuickAction({
  onClick,
  disabled,
  icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70 [&_svg]:text-primary"
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function AreaSkeleton() {
  return (
    <div className="space-y-1 p-1" aria-busy="true" aria-label="Loading areas">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-1.5 py-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

type PlaceSearch = {
  status: "idle" | "loading" | "done" | "error";
  results: GeoPlace[];
};

/**
 * Places from the geocoder for the text, debounced and ranked near the saved
 * location (or Dhaka). Only the latest answer is kept.
 */
function usePlaceSearch(
  query: string,
  saved: { lat: number; lng: number } | null,
): PlaceSearch {
  const [state, setState] = useState<PlaceSearch>({ status: "idle", results: [] });
  const request = useRef(0);
  const q = query.trim();
  const biasLat = saved?.lat ?? DHAKA_CENTER[0];
  const biasLng = saved?.lng ?? DHAKA_CENTER[1];

  // Short text clears at once, during render, rather than in the effect.
  const tooShort = q.length < PLACE_MIN_CHARS;
  if (tooShort && state.status !== "idle") setState({ status: "idle", results: [] });

  useEffect(() => {
    if (tooShort) {
      request.current++;
      return;
    }
    const id = ++request.current;
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, status: "loading" }));
      const res = await searchPlaces(q, { lat: biasLat, lng: biasLng }, 5);
      if (id !== request.current) return;
      setState(
        res.success
          ? {
              status: "done",
              results: (res.data ?? []).filter((p) => isInBangladesh(p.lat, p.lng)),
            }
          : { status: "error", results: [] },
      );
    }, PLACE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, tooShort, biasLat, biasLng]);

  return state;
}
