"use client";

// The /salons nearby-mode map: clustered pins for whatever area is in view,
// the point the list is measured from, and "Search this area". Touches
// `window` at import time; load it through ./MapClient only.
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import Image from "next/image";
import Link from "next/link";
import L from "leaflet";
import { Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { RotateCw, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/money";
import { formatDistance, haversineMeters, type LatLng } from "@/lib/geo";
import { usableImage } from "@/lib/salon-card";
import type { Bbox, SalonMarker } from "@/lib/api-types";
import { getSalonMarkers } from "@/services/salon/getSalonMarkers";
import LeafletMap, { PinMarker } from "./LeafletMap";
import { clusterIcon } from "./pin";

const FETCH_DEBOUNCE_MS = 500;
// GET /salons/map rejects boxes over 1.5° a side; stay under it after rounding.
const MAX_SPAN_DEG = 1.49;
// Ask for a margin around the view so small pans reuse the pins we have.
const FETCH_PAD = 0.25;
// How far the centre may drift (popup auto-pan, say) before the view counts
// as moved by the user.
const MOVED_PX = 80;
const MAX_FIT_ZOOM = 16;
const FIT_PADDING = L.point(32, 32);

export type SearchArea = { lat: number; lng: number; halfWidthKm: number };

export type SalonsMapProps = {
  // Where the list is measured from. The map frames `radiusKm` around it.
  origin: LatLng;
  originLabel?: string;
  radiusKm: number;
  // The card hovered in the list; its pin is drawn larger and darker.
  activeId?: string | null;
  onPinClick?: (id: string) => void;
  onSearchArea: (area: SearchArea) => void;
  className?: string;
};

type Layer = {
  markers: SalonMarker[];
  truncated: boolean;
  // The view is bigger than the API allows, so only its middle is loaded.
  tooWide: boolean;
  failed: boolean;
};

const toBox = (b: L.LatLngBounds): Bbox => [
  b.getWest(),
  b.getSouth(),
  b.getEast(),
  b.getNorth(),
];

const contains = (outer: Bbox, inner: Bbox) =>
  inner[0] >= outer[0] &&
  inner[1] >= outer[1] &&
  inner[2] <= outer[2] &&
  inner[3] <= outer[3];

const isTooWide = (b: Bbox) =>
  b[2] - b[0] > MAX_SPAN_DEG || b[3] - b[1] > MAX_SPAN_DEG;

// The padded view, cut down to the API's limit around the map centre.
function requestBox(map: L.Map): Bbox {
  const [west, south, east, north] = toBox(map.getBounds().pad(FETCH_PAD));
  const { lat, lng } = map.getCenter();
  const half = MAX_SPAN_DEG / 2;
  const [w, e] =
    east - west > MAX_SPAN_DEG ? [lng - half, lng + half] : [west, east];
  const [s, n] =
    north - south > MAX_SPAN_DEG ? [lat - half, lat + half] : [south, north];
  // ~11 m steps keep the request identical across sub-pixel moves.
  return [w, s, e, n].map((v) => Math.round(v * 1e4) / 1e4) as Bbox;
}

function halfWidthKm(map: L.Map): number {
  const { x, y } = map.getSize();
  const left = map.containerPointToLatLng([0, y / 2]);
  const right = map.containerPointToLatLng([x, y / 2]);
  return map.distance(left, right) / 2000;
}

type ControllerProps = {
  origin: LatLng;
  radiusKm: number;
  mapRef: RefObject<L.Map | null>;
  setMoved: Dispatch<SetStateAction<boolean>>;
  setLayer: Dispatch<SetStateAction<Layer>>;
};

// Frames each new search, loads pins for the view after every pan or zoom,
// and tells the parent when the view has left the framed search.
function MapController({
  origin,
  radiusKm,
  mapRef,
  setMoved,
  setLayer,
}: ControllerProps) {
  const map = useMap();
  const [lat, lng] = origin;
  // The view framed for the current search; any other view is the user's.
  const frame = useRef<{ center: L.LatLng; zoom: number } | null>(null);
  const fetches = useRef({
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
    id: 0,
    key: "",
    box: null as Bbox | null,
    truncated: false,
  });

  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);

  useEffect(() => {
    const center = L.latLng(lat, lng);
    const zoom = Math.min(
      map.getBoundsZoom(center.toBounds(radiusKm * 2000), false, FIT_PADDING),
      MAX_FIT_ZOOM,
    );
    const first = frame.current === null;
    frame.current = { center, zoom };
    // No fly-in on first paint; later searches glide so the jump is legible.
    map.setView(center, zoom, { animate: !first });
  }, [map, lat, lng, radiusKm]);

  useEffect(() => {
    const f = fetches.current;

    const load = async () => {
      const view = toBox(map.getBounds());
      const tooWide = isTooWide(view);
      setLayer((l) => (l.tooWide === tooWide ? l : { ...l, tooWide }));
      // Zooming in on a complete set of pins needs no new request.
      if (f.box && !f.truncated && contains(f.box, view)) return;

      const box = requestBox(map);
      const key = box.join(",");
      if (key === f.key) return;

      const id = ++f.id;
      const res = await getSalonMarkers(box);
      if (id !== f.id) return;
      if (!res.success || !res.data) {
        // Keep the pins we have; the next move retries.
        setLayer((l) => ({ ...l, failed: true }));
        return;
      }
      f.key = key;
      f.box = box;
      f.truncated = res.data.truncated;
      setLayer({
        markers: res.data.markers,
        truncated: res.data.truncated,
        tooWide,
        failed: false,
      });
    };

    const schedule = () => {
      clearTimeout(f.timer);
      f.timer = setTimeout(load, FETCH_DEBOUNCE_MS);
    };

    const onMoveEnd = () => {
      const fr = frame.current;
      if (fr) {
        const drift = map
          .latLngToContainerPoint(fr.center)
          .distanceTo(map.getSize().divideBy(2));
        setMoved(map.getZoom() !== fr.zoom || drift > MOVED_PX);
      }
      schedule();
    };

    map.on("moveend", onMoveEnd);
    schedule();
    return () => {
      map.off("moveend", onMoveEnd);
      clearTimeout(f.timer);
      f.id++; // drop a response still in flight
    };
  }, [map, setMoved, setLayer]);

  return null;
}

function SalonPopup({ marker, origin }: { marker: SalonMarker; origin: LatLng }) {
  const approximate = marker.locationAccuracy === "APPROXIMATE";
  const distance = formatDistance(
    haversineMeters(origin, [marker.latitude, marker.longitude]),
    approximate,
  );

  return (
    <div>
      <div className="relative h-28 w-full bg-muted">
        <Image
          src={usableImage(marker.image)}
          alt=""
          fill
          sizes="224px"
          className="object-cover"
        />
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-1 text-sm font-semibold">{marker.name}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
          <span className="font-semibold text-foreground">
            {Number(marker.rating ?? 0).toFixed(1)}
          </span>
          <span>({marker.totalReviews ?? 0})</span>
          {distance && (
            <>
              <span aria-hidden="true">·</span>
              <span title={approximate ? "Approximate location" : undefined}>
                {distance}
              </span>
            </>
          )}
        </p>
        {marker.minPriceMinor != null && (
          <p className="text-xs text-muted-foreground">
            From{" "}
            <span className="font-semibold text-foreground">
              {formatBDT(marker.minPriceMinor)}
            </span>
          </p>
        )}
        <Link
          href={`/salons/${marker.id}`}
          className="mt-1 flex h-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground! transition-colors hover:bg-primary/90"
        >
          View
        </Link>
      </div>
    </div>
  );
}

export default function SalonsMap({
  origin,
  originLabel,
  radiusKm,
  activeId,
  onPinClick,
  onSearchArea,
  className,
}: SalonsMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [moved, setMoved] = useState(false);
  const [layer, setLayer] = useState<Layer>({
    markers: [],
    truncated: false,
    tooWide: false,
    failed: false,
  });

  const searchHere = () => {
    const map = mapRef.current;
    if (!map) return;
    const { lat, lng } = map.getCenter();
    setMoved(false);
    onSearchArea({ lat, lng, halfWidthKm: halfWidthKm(map) });
  };

  const note = layer.failed
    ? "Couldn't load salons on the map."
    : layer.truncated || layer.tooWide
      ? "Zoom in to see all salons"
      : null;

  return (
    <div className={cn("relative", className)}>
      <LeafletMap center={origin} className="h-full">
        <MapController
          origin={origin}
          radiusKm={radiusKm}
          mapRef={mapRef}
          setMoved={setMoved}
          setLayer={setLayer}
        />
        <PinMarker position={origin} kind="user" title={originLabel} />
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={48}
          iconCreateFunction={(cluster: L.MarkerCluster) =>
            clusterIcon(cluster.getChildCount())
          }
        >
          {layer.markers.map((m) => (
            <PinMarker
              key={m.id}
              position={[m.latitude, m.longitude]}
              active={m.id === activeId}
              approximate={m.locationAccuracy === "APPROXIMATE"}
              title={m.name}
              onClick={() => onPinClick?.(m.id)}
            >
              <Popup className="sm-salon-popup" minWidth={224} maxWidth={224}>
                <SalonPopup marker={m} origin={origin} />
              </Popup>
            </PinMarker>
          ))}
        </MarkerClusterGroup>
      </LeafletMap>

      {moved && (
        <Button
          type="button"
          size="sm"
          onClick={searchHere}
          className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full shadow-md"
        >
          <RotateCw />
          Search this area
        </Button>
      )}

      {note && (
        <p
          role="status"
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md"
        >
          {note}
        </p>
      )}
    </div>
  );
}
