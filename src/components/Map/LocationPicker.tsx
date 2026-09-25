"use client";

// Owner-facing pin picker: address search, "I'm at the salon now" GPS, a
// draggable pin, and a "Looks like: …" reverse-geocode card. Leaflet itself
// stays behind the dynamic wrappers in ./MapClient.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Crosshair,
  Info,
  Loader2,
  MapPin,
  Search,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DHAKA_CENTER,
  isInBangladesh,
  roundCoord,
  type LatLng,
} from "@/lib/geo";
import type { GeoPlace } from "@/lib/api-types";
import { searchPlaces } from "@/services/geo/searchPlaces";
import { reversePlace } from "@/services/geo/reversePlace";
import { DraggablePin, InvalidateSize, LeafletMap, Recenter } from "./MapClient";

type Point = { lat: number; lng: number };

export type LocationPickerProps = {
  value?: Point | null;
  // Where the map (and the unplaced "drag me" pin) sits while `value` is
  // empty. While there is no pin, a change flies the map there; `label` names
  // the place in the notice. Ignored once a pin is set.
  fallbackCenter?: Point & { label?: string };
  onChange: (lat: number, lng: number) => void;
  // Shows [Use this address] on the "Looks like" card. The parent decides what
  // to fill; nothing is overwritten unless the owner clicks it.
  onAddressSuggestion?: (place: GeoPlace) => void;
  className?: string;
};

type Notice = { tone: "info" | "warn"; text: string };
type View = { center: LatLng; zoom: number; nonce: number };

const SEARCH_DEBOUNCE_MS = 400;
const REVERSE_DEBOUNCE_MS = 600;
const MIN_QUERY_LENGTH = 3;
const GPS_WARN_ACCURACY_M = 100;
const PIN_ZOOM = 17;
const AREA_ZOOM = 15;
const COUNTRY_ZOOM = 12;

const SEARCH_DOWN = "Address search is unavailable. Drag the pin instead.";

const toLatLng = (p: Point): LatLng => [p.lat, p.lng];

export default function LocationPicker({
  value,
  fallbackCenter,
  onChange,
  onAddressSuggestion,
  className,
}: LocationPickerProps) {
  const [view, setView] = useState<View>(() => ({
    center: value
      ? toLatLng(value)
      : fallbackCenter
        ? toLatLng(fallbackCenter)
        : DHAKA_CENTER,
    zoom: value ? PIN_ZOOM : fallbackCenter ? AREA_ZOOM : COUNTRY_ZOOM,
    nonce: 0,
  }));
  // Where the unplaced pin sits until the owner chooses a spot.
  const [ghost, setGhost] = useState<LatLng>(view.center);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [searchState, setSearchState] = useState<
    "idle" | "loading" | "empty" | "error"
  >("idle");
  const [resultsOpen, setResultsOpen] = useState(false);

  const [suggestion, setSuggestion] = useState<GeoPlace | null>(null);
  const [suggestionUsed, setSuggestionUsed] = useState(false);
  const [reverseState, setReverseState] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const [locating, setLocating] = useState(false);

  // Timers and request counters. Late responses from an older search or
  // lookup are dropped by comparing against the latest request id.
  const pending = useRef({
    searchTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    reverseTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    searchId: 0,
    reverseId: 0,
  });

  useEffect(() => {
    const p = pending.current;
    return () => {
      clearTimeout(p.searchTimer);
      clearTimeout(p.reverseTimer);
    };
  }, []);

  // Follow the parent's fallback centre while no pin is set.
  const fallbackKey = fallbackCenter
    ? `${fallbackCenter.lat},${fallbackCenter.lng}`
    : "";
  const [seenFallbackKey, setSeenFallbackKey] = useState(fallbackKey);
  if (fallbackKey !== seenFallbackKey) {
    setSeenFallbackKey(fallbackKey);
    if (fallbackCenter && !value) {
      const center = toLatLng(fallbackCenter);
      setView((v) => ({ center, zoom: AREA_ZOOM, nonce: v.nonce + 1 }));
      setGhost(center);
      setNotice(
        fallbackCenter.label
          ? {
              tone: "info",
              text: `We moved the map to ${fallbackCenter.label}. Now drag the pin to your door.`,
            }
          : null,
      );
    }
  }

  const flyTo = (center: LatLng, zoom = PIN_ZOOM) =>
    setView((v) => ({ center, zoom, nonce: v.nonce + 1 }));

  const lookUpAddress = (lat: number, lng: number) => {
    const p = pending.current;
    clearTimeout(p.reverseTimer);
    setSuggestion(null);
    setSuggestionUsed(false);
    setReverseState("loading");

    p.reverseTimer = setTimeout(async () => {
      const id = ++p.reverseId;
      const res = await reversePlace(lat, lng);
      if (id !== p.reverseId) return;
      if (res.success && res.data) {
        setSuggestion(res.data);
        setReverseState("idle");
      } else {
        setReverseState("error");
      }
    }, REVERSE_DEBOUNCE_MS);
  };

  // Accepts a spot for the pin. Returns false (and the pin snaps back) when it
  // is outside Bangladesh, which the API would reject anyway.
  const commit = (
    lat: number,
    lng: number,
    { lookUp = true }: { lookUp?: boolean } = {},
  ): boolean => {
    if (!isInBangladesh(lat, lng)) {
      setNotice({
        tone: "warn",
        text: "That spot is outside Bangladesh. Please place the pin on your salon.",
      });
      return false;
    }
    const rLat = roundCoord(lat, 6);
    const rLng = roundCoord(lng, 6);
    onChange(rLat, rLng);
    setNotice(null);
    if (lookUp) lookUpAddress(rLat, rLng);
    return true;
  };

  const onQueryChange = (next: string) => {
    const p = pending.current;
    setQuery(next);
    clearTimeout(p.searchTimer);

    const q = next.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      p.searchId++;
      setResults([]);
      setSearchState("idle");
      return;
    }

    setSearchState("loading");
    setResultsOpen(true);
    const bias = value ?? { lat: view.center[0], lng: view.center[1] };

    p.searchTimer = setTimeout(async () => {
      const id = ++p.searchId;
      const res = await searchPlaces(q, bias);
      if (id !== p.searchId) return;
      if (!res.success) {
        setResults([]);
        setSearchState("error");
        return;
      }
      const places = res.data ?? [];
      setResults(places);
      setSearchState(places.length ? "idle" : "empty");
    }, SEARCH_DEBOUNCE_MS);
  };

  const selectPlace = (place: GeoPlace) => {
    setQuery(place.label);
    setResults([]);
    setResultsOpen(false);
    // We already know what's here, so skip the reverse lookup.
    if (!commit(place.lat, place.lng, { lookUp: false })) return;
    flyTo([place.lat, place.lng]);
    clearTimeout(pending.current.reverseTimer);
    pending.current.reverseId++;
    setSuggestion(place);
    setSuggestionUsed(false);
    setReverseState("idle");
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Inside the Add Salon form, Enter would submit the whole form.
    if (e.key === "Enter") {
      e.preventDefault();
      if (results[0]) selectPlace(results[0]);
    } else if (e.key === "Escape" && resultsOpen) {
      e.preventDefault();
      setResultsOpen(false);
    }
  };

  const locateMe = () => {
    if (!("geolocation" in navigator)) {
      setNotice({
        tone: "warn",
        text: "This browser can't share its location. Search or drag the pin instead.",
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        if (!commit(coords.latitude, coords.longitude)) return;
        flyTo([coords.latitude, coords.longitude]);
        if (coords.accuracy > GPS_WARN_ACCURACY_M) {
          setNotice({
            tone: "warn",
            text: `Your GPS is imprecise (±${Math.round(coords.accuracy)} m). Please drag the pin to the exact spot.`,
          });
        }
      },
      (err) => {
        setLocating(false);
        setNotice({
          tone: "warn",
          text:
            err.code === err.PERMISSION_DENIED
              ? "Location access is blocked. Search or drag the pin instead."
              : "We couldn't get your location. Search or drag the pin instead.",
        });
      },
      // Owners need their door, not their neighbourhood.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const applySuggestion = () => {
    if (!suggestion || !onAddressSuggestion) return;
    onAddressSuggestion(suggestion);
    setSuggestionUsed(true);
  };

  const pin = value ? toLatLng(value) : ghost;
  const showResults =
    resultsOpen && (results.length > 0 || searchState !== "idle");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onSearchKeyDown}
          onFocus={() => setResultsOpen(true)}
          onBlur={() => setResultsOpen(false)}
          placeholder="Search your road, building or landmark"
          className="pl-9"
          role="combobox"
          aria-expanded={showResults}
          aria-controls="location-picker-results"
          aria-autocomplete="list"
          autoComplete="off"
        />

        {showResults && (
          <div
            id="location-picker-results"
            role="listbox"
            // Keep focus in the input so onBlur doesn't close the list
            // before a click on a result registers.
            onMouseDown={(e) => e.preventDefault()}
            className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover text-sm shadow-md"
          >
            {searchState === "loading" && (
              <p className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </p>
            )}
            {searchState === "error" && (
              <p className="px-3 py-2 text-muted-foreground">{SEARCH_DOWN}</p>
            )}
            {searchState === "empty" && (
              <p className="px-3 py-2 text-muted-foreground">
                No matches. Try a nearby landmark, or drag the pin.
              </p>
            )}
            {searchState !== "loading" &&
              results.map((place) => (
                <button
                  key={`${place.lat},${place.lng},${place.label}`}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => selectPlace(place)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <span className="line-clamp-2">{place.label}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {searchState === "error" && !resultsOpen && (
        <p className="text-xs text-muted-foreground">{SEARCH_DOWN}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={locateMe}
        disabled={locating}
      >
        {locating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Crosshair className="mr-2 h-4 w-4" />
        )}
        I&apos;m at the salon now
      </Button>

      {/* Map */}
      <div className="h-[280px]">
        <LeafletMap center={view.center} zoom={view.zoom} className="h-full">
          <InvalidateSize />
          <Recenter key={view.nonce} center={view.center} zoom={view.zoom} />
          <DraggablePin position={pin} placed={Boolean(value)} onMove={commit} />
        </LeafletMap>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Drag the pin onto your salon&apos;s entrance.
        </p>
        {value && (
          <p className="font-mono text-xs text-muted-foreground">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </p>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
            notice.tone === "warn"
              ? "border-gold/50 bg-gold/10 text-foreground"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {notice.tone === "warn" ? (
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-dark" />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Reverse geocode */}
      {reverseState === "loading" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Looking up the address…
        </p>
      )}
      {reverseState === "error" && (
        <p className="text-xs text-muted-foreground">
          Address lookup is unavailable. Your pin still works.
        </p>
      )}
      {suggestion && reverseState === "idle" && (
        <div className="flex flex-col gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="text-muted-foreground">Looks like: </span>
            {suggestion.label}
          </p>
          {onAddressSuggestion && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={applySuggestion}
              disabled={suggestionUsed}
            >
              {suggestionUsed ? "Address filled" : "Use this address"}
            </Button>
          )}
        </div>
      )}

      <input
        type="hidden"
        name="latitude"
        value={value ? String(value.lat) : ""}
      />
      <input
        type="hidden"
        name="longitude"
        value={value ? String(value.lng) : ""}
      />
    </div>
  );
}
