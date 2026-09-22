"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { GEOLOCATION_MESSAGES, useGeolocation } from "@/hooks/useGeolocation";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import { isInBangladesh, roundCoord, shortPlaceLabel } from "@/lib/geo";
import {
  clearLocation,
  saveLocation,
  type SavedLocation,
} from "@/lib/location-cookie";
import type { GeoPlace } from "@/lib/api-types";
import { reversePlace } from "@/services/geo/reversePlace";
import { searchPlaces } from "@/services/geo/searchPlaces";

// Used when the geocoder can't be reached, so popular areas keep working.
const POPULAR_AREAS: { name: string; lat: number; lng: number }[] = [
  { name: "Dhanmondi", lat: 23.746, lng: 90.374 },
  { name: "Gulshan", lat: 23.793, lng: 90.414 },
  { name: "Uttara", lat: 23.874, lng: 90.39 },
  { name: "Mirpur", lat: 23.807, lng: 90.368 },
  { name: "Banani", lat: 23.794, lng: 90.404 },
  { name: "Mohammadpur", lat: 23.766, lng: 90.359 },
];

const OUTSIDE_BD_MESSAGE =
  "Looks like you're outside Bangladesh. Pick an area to browse salons.";
const SEARCH_DOWN_MESSAGE = "Address search is unavailable.";

type LocationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called after a location is saved or cleared.
  onDone?: () => void;
};

const LocationDialog = ({ open, onOpenChange, onDone }: LocationDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">
          Where should we look?
        </DialogTitle>
        <DialogDescription>
          We&apos;ll show salons near this spot. It&apos;s remembered in this
          browser, never saved to your account.
        </DialogDescription>
      </DialogHeader>
      {/* Mounted only while open, so every open starts fresh. */}
      <LocationPicker
        onDone={() => {
          onOpenChange(false);
          onDone?.();
        }}
      />
    </DialogContent>
  </Dialog>
);

const LocationPicker = ({ onDone }: { onDone: () => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const saved = useSavedLocation();
  const geo = useGeolocation();

  const [resolving, setResolving] = useState(false);
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

  const busy = geo.status === "locating" || resolving || pickingArea !== null;

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

  const locateWithGps = async () => {
    setOutsideBd(false);
    const coords = await geo.locate();
    if (!coords || !aliveRef.current) {
      if (aliveRef.current && !coords) searchRef.current?.focus();
      return;
    }
    if (!isInBangladesh(coords.lat, coords.lng)) {
      setOutsideBd(true);
      return;
    }

    const lat = roundCoord(coords.lat);
    const lng = roundCoord(coords.lng);
    setResolving(true);
    const res = await reversePlace(lat, lng);
    if (!aliveRef.current) return;
    setResolving(false);
    const label =
      res.success && res.data ? shortPlaceLabel(res.data) : "Current location";
    commit({ lat, lng, label: label || "Current location", source: "gps" });
  };

  const onQueryChange = (value: string) => {
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
      const bias = saved ? { lat: saved.lat, lng: saved.lng } : undefined;
      const res = await searchPlaces(q, bias);
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

  const pickPlace = (place: GeoPlace) => {
    commit({
      lat: place.lat,
      lng: place.lng,
      label: shortPlaceLabel(place),
      source: "search",
    });
  };

  const pickArea = async (area: (typeof POPULAR_AREAS)[number]) => {
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
    <div className="space-y-5">
      <div className="space-y-2">
        {showGpsButton && (
          <Button
            type="button"
            variant="gold"
            className="h-12 w-full text-base"
            onClick={locateWithGps}
            disabled={busy}
          >
            {geo.status === "locating" || resolving ? (
              <>
                <Loader2 className="animate-spin" />
                Finding your location…
              </>
            ) : (
              <>
                <Crosshair />
                {canRetry ? "Try again" : "Use my current location"}
              </>
            )}
          </Button>
        )}
        {gpsMessage && (
          <p
            role="status"
            className="rounded-lg border border-rose/30 bg-rose/5 px-3 py-2 text-sm text-foreground"
          >
            {gpsMessage}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2">
        <label htmlFor="location-search" className="sr-only">
          Search area, road or landmark
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="location-search"
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search area, road or landmark"
            autoComplete="off"
            className="h-11 pl-9"
            aria-describedby="location-search-status"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <div id="location-search-status" aria-live="polite">
          {searchError ? (
            <p className="px-1 text-sm text-muted-foreground">{searchError}</p>
          ) : !searching && query.trim().length >= 2 && results.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              No places found. Try a nearby area or landmark.
            </p>
          ) : null}
        </div>

        {results.length > 0 && (
          <ul className="overflow-hidden rounded-lg border" aria-label="Places">
            {results.map((place) => (
              <li key={`${place.lat},${place.lng},${place.label}`}>
                <button
                  type="button"
                  onClick={() => pickPlace(place)}
                  disabled={busy}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span>{place.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Popular areas</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_AREAS.map((area) => (
            <button
              key={area.name}
              type="button"
              onClick={() => pickArea(area)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
            >
              {pickingArea === area.name && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {saved && (
        <button
          type="button"
          onClick={clearSaved}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear saved location
        </button>
      )}
    </div>
  );
};

export default LocationDialog;
