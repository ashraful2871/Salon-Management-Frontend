"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Crosshair,
  Hand,
  Loader2,
  Map as MapIcon,
  MapPin,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import {
  CenterTracker,
  InvalidateSize,
  LeafletMap,
  LocateControl,
  Recenter,
  type GeoFix,
} from "../Map/MapClient";
import { GEOLOCATION_MESSAGES, useGeolocation } from "@/hooks/useGeolocation";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import { cn } from "@/lib/utils";
import {
  DHAKA_CENTER,
  isInBangladesh,
  roundCoord,
  shortPlaceLabel,
} from "@/lib/geo";
import {
  clearLocation,
  saveLocation,
  type LocationSource,
  type SavedLocation,
} from "@/lib/location-cookie";
import type { GeoPlace } from "@/lib/api-types";
// Also the fallback when the geocoder can't be reached, so areas keep working.
import { POPULAR_AREAS, type PopularArea } from "@/constants/popular-areas";
import { reversePlace } from "@/services/geo/reversePlace";
import { searchPlaces } from "@/services/geo/searchPlaces";


const OUTSIDE_BD_MESSAGE =
  "Looks like you're outside Bangladesh. Pick an area to browse salons.";
const SEARCH_DOWN_MESSAGE = "Address search is unavailable.";

const PIN_ZOOM = 17;
const BROWSE_ZOOM = 15;
// Wait for the map to settle before asking what is under the pin. Lookups
// share one rate limit, so a pan that is still going should not spend one.
const REVERSE_DEBOUNCE_MS = 450;

type Point = { lat: number; lng: number };

// "map" is the pin screen: where the customer confirms (or fine-tunes) the
// exact spot before it is saved, the way ride and delivery apps do it.
type Step =
  | { kind: "options" }
  | {
      kind: "map";
      center: Point;
      zoom: number;
      source: LocationSource;
      // What we already know is under the pin (a search result), so the
      // first lookup can be skipped.
      place?: GeoPlace | null;
      fix?: GeoFix | null;
    };

type LocationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called after a location is saved or cleared.
  onDone?: () => void;
  // "map" opens straight on the pin screen ("Pick on map" buttons).
  initialStep?: "options" | "map";
};

const LocationDialog = ({
  open,
  onOpenChange,
  onDone,
  initialStep = "options",
}: LocationDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn(
        "max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg",
        // Phones: a bottom sheet rather than a floating card.
        "max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:border-x-0 max-sm:border-b-0",
        "max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:zoom-in-100 max-sm:data-[state=closed]:zoom-out-100",
      )}
    >
      {/* Mounted only while open, so every open starts fresh. */}
      <LocationPicker
        initialStep={initialStep}
        onDone={() => {
          onOpenChange(false);
          onDone?.();
        }}
      />
    </DialogContent>
  </Dialog>
);

const LocationPicker = ({
  onDone,
  initialStep,
}: {
  onDone: () => void;
  initialStep: "options" | "map";
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const saved = useSavedLocation();
  const geo = useGeolocation();

  const browseStep = (from: SavedLocation | null): Step => ({
    kind: "map",
    center: from ? { lat: from.lat, lng: from.lng } : {
      lat: DHAKA_CENTER[0],
      lng: DHAKA_CENTER[1],
    },
    zoom: from ? BROWSE_ZOOM + 1 : 13,
    source: "map",
  });

  const [step, setStep] = useState<Step>(() =>
    initialStep === "map" ? browseStep(null) : { kind: "options" },
  );
  // `saved` is null on the first render (the cookie is read after mount), so
  // "Pick on map" re-centres on it once it arrives.
  const [seededFromSaved, setSeededFromSaved] = useState(false);
  if (!seededFromSaved && saved && initialStep === "map") {
    setSeededFromSaved(true);
    if (step.kind === "map" && step.source === "map" && !step.place) {
      setStep(browseStep(saved));
    }
  }

  const [outsideBd, setOutsideBd] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pickingArea, setPickingArea] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const busy = geo.status === "locating" || pickingArea !== null;

  const commit = (loc: SavedLocation) => {
    if (!aliveRef.current) return;
    const stored = saveLocation(loc);
    if (!stored) {
      setOutsideBd(true);
      return;
    }
    onDone();
    if (pathname === "/salons") {
      router.push(
        `/salons?lat=${stored.lat}&lng=${stored.lng}&r=5&sort=distance`,
      );
    } else {
      router.refresh();
    }
  };

  // GPS no longer saves straight away: it opens the pin screen on the fix, so
  // the customer can see where we think they are and nudge it to the door.
  const locateWithGps = async () => {
    setOutsideBd(false);
    const coords = await geo.locate();
    if (!aliveRef.current) return;
    if (!coords) {
      searchRef.current?.focus();
      return;
    }
    if (!isInBangladesh(coords.lat, coords.lng)) {
      setOutsideBd(true);
      return;
    }
    setStep({
      kind: "map",
      center: coords,
      zoom: PIN_ZOOM,
      source: "gps",
      fix: { ...coords, accuracy: coords.accuracy ?? 0 },
    });
  };

  const resetSearch = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    requestRef.current++;
    setQuery("");
    setResults([]);
    setSearching(false);
    setSearchError(null);
  };

  const onQueryChange = (value: string, bias?: Point) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = value.trim();
    if (q.length < 2) {
      requestRef.current++;
      setResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    setSearching(true);
    timerRef.current = setTimeout(async () => {
      const id = ++requestRef.current;
      const near = bias ?? (saved ? { lat: saved.lat, lng: saved.lng } : undefined);
      const res = await searchPlaces(q, near);
      if (!aliveRef.current || id !== requestRef.current) return;
      setSearching(false);
      if (!res.success) {
        setResults([]);
        setSearchError(SEARCH_DOWN_MESSAGE);
        return;
      }
      setSearchError(null);
      setResults(
        (res.data ?? []).filter((p) => isInBangladesh(p.lat, p.lng)),
      );
    }, 300);
  };

  // A search result opens the pin screen on that place.
  const pickPlace = (place: GeoPlace) => {
    resetSearch();
    setStep({
      kind: "map",
      center: { lat: place.lat, lng: place.lng },
      zoom: PIN_ZOOM,
      source: "search",
      place,
    });
  };

  const pickArea = async (area: PopularArea) => {
    setOutsideBd(false);
    setPickingArea(area.name);
    const res = await searchPlaces(`${area.name}, Dhaka`, undefined, 1);
    if (!aliveRef.current) return;
    setPickingArea(null);
    const place = res.success ? res.data?.[0] : undefined;
    const geocoded = place && isInBangladesh(place.lat, place.lng);
    commit({
      lat: geocoded ? place.lat : area.lat,
      lng: geocoded ? place.lng : area.lng,
      label: `${area.name}, Dhaka`,
      source: "area",
    });
  };

  const clearSaved = () => {
    clearLocation();
    onDone();
    if (pathname === "/salons") router.push("/salons");
    else router.refresh();
  };

  if (step.kind === "map") {
    return (
      <MapStep
        key={`${step.center.lat},${step.center.lng},${step.source}`}
        step={step}
        query={query}
        results={results}
        searching={searching}
        searchError={searchError}
        onQueryChange={onQueryChange}
        onResetSearch={resetSearch}
        onBack={() => {
          resetSearch();
          setStep({ kind: "options" });
        }}
        onConfirm={commit}
      />
    );
  }

  const showGpsButton = geo.supported && !geo.deniedBefore;
  const gpsMessage = outsideBd
    ? OUTSIDE_BD_MESSAGE
    : geo.deniedBefore
      ? GEOLOCATION_MESSAGES.denied
      : !geo.supported
        ? GEOLOCATION_MESSAGES.unsupported
        : geo.message;
  const canRetry =
    showGpsButton && (geo.status === "timeout" || geo.status === "unavailable");

  return (
    <div className="flex flex-col">
      <SheetHandle />
      <DialogHeader className="px-5 pt-5 pr-12 pb-4 text-left sm:px-6 sm:pt-6">
        <DialogTitle className="font-display text-xl">
          Where should we look?
        </DialogTitle>
        <DialogDescription>
          We&apos;ll show salons near this spot. It&apos;s remembered in this
          browser, never saved to your account.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 px-5 pb-6 sm:px-6">
        {saved && (
          <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 px-3.5 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15">
              <MapPin className="h-4 w-4 text-gold-dark" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Current location
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {saved.label}
              </p>
            </div>
            <button
              type="button"
              onClick={clearSaved}
              className="shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {showGpsButton && (
            <OptionButton
              onClick={locateWithGps}
              disabled={busy}
              icon={
                geo.status === "locating" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Crosshair className="h-5 w-5" />
                )
              }
              title={
                geo.status === "locating"
                  ? "Finding you…"
                  : canRetry
                    ? "Try again"
                    : "Use my current location"
              }
              hint="Then fine-tune the pin"
              primary
            />
          )}
          <OptionButton
            onClick={() => {
              setOutsideBd(false);
              setStep(browseStep(saved));
            }}
            disabled={busy}
            icon={<MapIcon className="h-5 w-5" />}
            title="Choose on map"
            hint="Drop a pin anywhere"
            className={cn(!showGpsButton && "sm:col-span-2")}
          />
        </div>

        {gpsMessage && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl border border-rose/30 bg-rose/5 px-3 py-2.5 text-sm text-foreground"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
            {gpsMessage}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or search
          <span className="h-px flex-1 bg-border" />
        </div>

        <SearchBox
          inputRef={searchRef}
          query={query}
          results={results}
          searching={searching}
          searchError={searchError}
          onQueryChange={(v) => onQueryChange(v)}
          onPick={pickPlace}
          disabled={busy}
        />

        <div className="space-y-2.5">
          <p className="text-sm font-semibold">Popular areas</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_AREAS.map((area) => (
              <button
                key={area.name}
                type="button"
                onClick={() => pickArea(area)}
                disabled={busy}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pickingArea === area.name ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-gold" />
                )}
                {area.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// The grab bar that says "this is a sheet" on phones.
const SheetHandle = () => (
  <span
    aria-hidden="true"
    className="mx-auto mt-2.5 block h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25 sm:hidden"
  />
);

const OptionButton = ({
  onClick,
  disabled,
  icon,
  title,
  hint,
  primary = false,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  hint: string;
  primary?: boolean;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "group flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60",
      primary
        ? "border-transparent bg-gradient-gold text-white shadow-gold hover:brightness-105"
        : "border-border bg-background hover:border-gold/50 hover:bg-gold/5",
      className,
    )}
  >
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
        primary ? "bg-white/20" : "bg-gold/10 text-gold-dark",
      )}
    >
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold">{title}</span>
      <span
        className={cn(
          "block text-xs",
          primary ? "text-white/85" : "text-muted-foreground",
        )}
      >
        {hint}
      </span>
    </span>
    <ChevronRight
      className={cn(
        "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
        primary ? "text-white/80" : "text-muted-foreground",
      )}
    />
  </button>
);

const SearchBox = ({
  inputRef,
  query,
  results,
  searching,
  searchError,
  onQueryChange,
  onPick,
  disabled,
  floating = false,
}: {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  query: string;
  results: GeoPlace[];
  searching: boolean;
  searchError: string | null;
  onQueryChange: (value: string) => void;
  onPick: (place: GeoPlace) => void;
  disabled?: boolean;
  // Over the map: the result list floats instead of pushing the map down.
  floating?: boolean;
}) => {
  const showEmpty =
    !searchError && !searching && query.trim().length >= 2 && results.length === 0;

  return (
    <div className="relative space-y-2">
      <label htmlFor="location-search" className="sr-only">
        Search area, road or landmark
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="location-search"
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (results[0]) onPick(results[0]);
            }
          }}
          placeholder="Search area, road or landmark"
          autoComplete="off"
          className={cn(
            "h-11 rounded-xl pl-10 pr-10",
            floating && "border-transparent bg-white shadow-md",
          )}
          aria-describedby="location-search-status"
        />
        {searching ? (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          floating &&
            (results.length > 0 || searchError || showEmpty) &&
            "absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border bg-popover shadow-lg",
        )}
      >
        <div id="location-search-status" aria-live="polite">
          {searchError ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{searchError}</p>
          ) : showEmpty ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No places found. Try a nearby area or landmark.
            </p>
          ) : null}
        </div>

        {results.length > 0 && (
          <ul
            className={cn(
              "max-h-64 overflow-y-auto",
              !floating && "overflow-hidden rounded-xl border",
            )}
            aria-label="Places"
          >
            {results.map((place) => (
              <li key={`${place.lat},${place.lng},${place.label}`}>
                <button
                  type="button"
                  onClick={() => onPick(place)}
                  disabled={disabled}
                  className="flex w-full cursor-pointer items-start gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {shortPlaceLabel(place)}
                    </span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {place.label}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

type Address =
  | { status: "loading" }
  | { status: "ready"; place: GeoPlace | null }
  | { status: "outside" };

const lookupKey = ({ lat, lng }: Point) => `${roundCoord(lat)},${roundCoord(lng)}`;

/**
 * The pin screen. The pin stays in the middle and the map moves under it —
 * precise with one thumb, and it never hides under the finger — and the card
 * below names what is under the tip once the map settles.
 */
const MapStep = ({
  step,
  query,
  results,
  searching,
  searchError,
  onQueryChange,
  onResetSearch,
  onBack,
  onConfirm,
}: {
  step: Extract<Step, { kind: "map" }>;
  query: string;
  results: GeoPlace[];
  searching: boolean;
  searchError: string | null;
  onQueryChange: (value: string, bias?: Point) => void;
  onResetSearch: () => void;
  onBack: () => void;
  onConfirm: (loc: SavedLocation) => void;
}) => {
  const [center, setCenter] = useState<Point>(step.center);
  const [source, setSource] = useState<LocationSource>(step.source);
  const [moving, setMoving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [view, setView] = useState({
    center: [step.center.lat, step.center.lng] as [number, number],
    zoom: step.zoom,
    nonce: 0,
  });
  const [address, setAddress] = useState<Address>(() =>
    !isInBangladesh(step.center.lat, step.center.lng)
      ? { status: "outside" }
      : step.place
        ? { status: "ready", place: step.place }
        : { status: "loading" },
  );

  // Reverse lookups, by ~110 m cell: the saved point is rounded to that
  // anyway, and it keeps a customer panning back and forth off the shared
  // geocoder limit.
  const lookups = useRef(
    new Map<string, GeoPlace | null>(
      step.place ? [[lookupKey(step.center), step.place]] : [],
    ),
  );
  const pending = useRef({
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
    id: 0,
  });

  // The async half: asks the geocoder once the map has been still for a
  // moment. A newer move bumps `id` and the late answer is dropped.
  const fetchPlace = (point: Point) => {
    const p = pending.current;
    clearTimeout(p.timer);
    const id = ++p.id;
    p.timer = setTimeout(async () => {
      const res = await reversePlace(roundCoord(point.lat), roundCoord(point.lng));
      if (id !== pending.current.id) return;
      const place = res.success && res.data ? res.data : null;
      lookups.current.set(lookupKey(point), place);
      setAddress({ status: "ready", place });
    }, REVERSE_DEBOUNCE_MS);
  };

  const lookUp = (point: Point) => {
    const p = pending.current;
    clearTimeout(p.timer);
    p.id++;
    if (!isInBangladesh(point.lat, point.lng)) {
      setAddress({ status: "outside" });
      return;
    }
    const key = lookupKey(point);
    if (lookups.current.has(key)) {
      setAddress({ status: "ready", place: lookups.current.get(key) ?? null });
      return;
    }
    setAddress({ status: "loading" });
    fetchPlace(point);
  };

  // The spot the screen opened on needs a name too: the map fires no move for
  // its own mount. Its "loading" state was set by the initialiser above.
  const needsFirstLookup = address.status === "loading";
  const openedOn = useRef(step.center);
  useEffect(() => {
    const p = pending.current;
    if (needsFirstLookup) fetchPlace(openedOn.current);
    return () => clearTimeout(p.timer);
    // Only on mount: later spots are looked up by onMoveEnd.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMoveEnd = (next: Point, byUser: boolean) => {
    setMoving(false);
    setCenter(next);
    if (byUser) {
      setTouched(true);
      setSource("map");
    }
    lookUp(next);
  };

  const flyTo = (picked: GeoPlace) => {
    onResetSearch();
    lookups.current.set(lookupKey(picked), picked);
    setSource("search");
    setView((v) => ({
      center: [picked.lat, picked.lng],
      zoom: PIN_ZOOM,
      nonce: v.nonce + 1,
    }));
  };

  const place = address.status === "ready" ? address.place : null;
  const title = place ? shortPlaceLabel(place) : "Pinned location";
  const canConfirm = !moving && address.status === "ready";

  const confirm = () => {
    if (!canConfirm) return;
    onConfirm({
      lat: center.lat,
      lng: center.lng,
      label: place ? shortPlaceLabel(place) || "Pinned location" : "Pinned location",
      source,
    });
  };

  return (
    <div className="flex flex-col">
      <SheetHandle />
      <div className="flex items-start gap-2 px-4 pt-4 pb-3 pr-12 sm:px-5 sm:pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to location options"
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <DialogHeader className="min-w-0 gap-0.5 text-left">
          <DialogTitle className="font-display text-lg leading-tight">
            Set your exact location
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Move the map to place the pin on your spot.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="relative px-4 pb-3 sm:px-5">
        <SearchBox
          query={query}
          results={results}
          searching={searching}
          searchError={searchError}
          onQueryChange={(v) => onQueryChange(v, center)}
          onPick={flyTo}
          floating
        />
      </div>

      <div className="relative mx-4 h-[42dvh] min-h-[240px] overflow-hidden rounded-2xl border sm:mx-5 sm:h-[340px]">
        <LeafletMap center={view.center} zoom={view.zoom} className="h-full rounded-2xl">
          <InvalidateSize />
          {view.nonce > 0 && (
            <Recenter key={view.nonce} center={view.center} zoom={view.zoom} />
          )}
          <CenterTracker
            onMoveStart={() => setMoving(true)}
            onMoveEnd={onMoveEnd}
          />
          <LocateControl zoom={PIN_ZOOM} initialFix={step.fix ?? null} />
        </LeafletMap>

        {/* The pin: its tip is the map centre. Lifts while the map moves. */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-1/2 top-1/2 h-1.5 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30 blur-[1px] transition-transform duration-200",
              moving && "scale-150 opacity-60",
            )}
          />
          <svg
            aria-hidden="true"
            width="40"
            height="52"
            viewBox="-2 -2 28 36"
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 drop-shadow-[0_4px_6px_rgb(0_0_0/0.35)] transition-transform duration-200 ease-out",
              moving ? "-translate-y-[calc(100%+10px)]" : "-translate-y-full",
            )}
          >
            <path
              d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
              style={{ fill: "var(--gold-dark)", stroke: "#fff", strokeWidth: 2 }}
            />
            <circle cx="12" cy="12" r="4.5" fill="#fff" />
          </svg>
        </div>

        {!touched && (
          <p className="pointer-events-none absolute left-1/2 top-3 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-charcoal/90 px-3 py-1.5 text-xs font-medium text-white shadow-md">
            <Hand className="h-3.5 w-3.5" aria-hidden="true" />
            Drag the map to move the pin
          </p>
        )}
      </div>

      <div className="space-y-3 px-4 pt-4 pb-5 sm:px-5 sm:pb-6">
        <div
          aria-live="polite"
          className="flex min-h-[4.25rem] items-start gap-3 rounded-2xl border bg-muted/30 px-3.5 py-3"
        >
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full",
              address.status === "outside" ? "bg-rose/15" : "bg-gold/15",
            )}
          >
            {address.status === "outside" ? (
              <TriangleAlert className="h-4 w-4 text-rose" />
            ) : (
              <MapPin className="h-4 w-4 text-gold-dark" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            {address.status === "outside" ? (
              <>
                <p className="text-sm font-semibold text-foreground">
                  Outside Bangladesh
                </p>
                <p className="text-xs text-muted-foreground">
                  Move the pin back over Bangladesh to search there.
                </p>
              </>
            ) : moving || address.status === "loading" ? (
              <div className="space-y-2 py-0.5" aria-label="Finding the address">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-foreground">
                  {title}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {place
                    ? place.label
                    : "We couldn't name this spot, but the pin still works."}
                </p>
              </>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="gold"
          className="h-12 w-full rounded-xl text-base"
          onClick={confirm}
          disabled={!canConfirm}
        >
          {moving || address.status === "loading" ? (
            <>
              <Loader2 className="animate-spin" />
              Finding address…
            </>
          ) : (
            <>
              <Check />
              Confirm location
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LocationDialog;
