"use client";

// Touches `window` at import time. Never import this file directly; use the
// `next/dynamic` wrappers in ./MapClient.
import "leaflet/dist/leaflet.css";
import "./map.css";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { cn } from "@/lib/utils";
import { DHAKA_CENTER, type LatLng } from "@/lib/geo";
import { salonPin, userDot } from "./pin";

const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export type LeafletMapProps = {
  center?: LatLng;
  zoom?: number;
  className?: string;
  // false: no drag, scroll-zoom, pinch or double-click zoom (for small embedded
  // maps that must not trap page scrolling). The zoom buttons stay.
  interactive?: boolean;
  children?: ReactNode;
};

export default function LeafletMap({
  center = DHAKA_CENTER,
  zoom = 13,
  className,
  interactive = true,
  children,
}: LeafletMapProps) {
  return (
    // `isolate z-0` traps Leaflet's pane z-indexes (400-1000) in their own
    // stacking context so they never cover the navbar or dialogs.
    <div
      className={cn("relative isolate z-0 overflow-hidden rounded-xl", className)}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        dragging={interactive}
        scrollWheelZoom={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {children}
      </MapContainer>
    </div>
  );
}

// MapContainer ignores center/zoom changes after mount; render this as a child
// to move the map when they change.
export function Recenter({ center, zoom }: { center: LatLng; zoom?: number }) {
  const map = useMap();
  const [lat, lng] = center;

  useEffect(() => {
    const targetZoom = zoom ?? map.getZoom();
    if (map.getCenter().distanceTo([lat, lng]) < 1 && map.getZoom() === targetZoom) {
      return;
    }
    map.flyTo([lat, lng], targetZoom, { duration: 0.6 });
  }, [map, lat, lng, zoom]);

  return null;
}

// Fits the view to the given points. Re-fits only when the set of points
// changes, not on every render, so it doesn't fight the user's panning.
export function FitToPoints({
  points,
  padding = 40,
  maxZoom = 15,
}: {
  points: LatLng[];
  padding?: number;
  maxZoom?: number;
}) {
  const map = useMap();
  const key = points.map(([lat, lng]) => `${lat},${lng}`).join("|");

  useEffect(() => {
    if (!key) return;
    const pts = key.split("|").map((p) => p.split(",").map(Number) as LatLng);
    if (pts.length === 1) {
      map.setView(pts[0], maxZoom);
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [padding, padding], maxZoom });
  }, [map, key, padding, maxZoom]);

  return null;
}

export type PinMarkerProps = {
  position: LatLng;
  kind?: "salon" | "user";
  active?: boolean;
  approximate?: boolean;
  title?: string;
  onClick?: () => void;
  children?: ReactNode;
};

// Marker with our DivIcons. Callers can't build icons themselves because
// leaflet must not be imported outside this dynamically loaded module.
export function PinMarker({
  position,
  kind = "salon",
  active = false,
  approximate = false,
  title,
  onClick,
  children,
}: PinMarkerProps) {
  const icon = useMemo(
    () => (kind === "user" ? userDot() : salonPin({ active, approximate })),
    [kind, active, approximate],
  );
  const eventHandlers = useMemo(
    () => (onClick ? { click: onClick } : undefined),
    [onClick],
  );

  return (
    <Marker
      position={position}
      icon={icon}
      title={title}
      keyboard={Boolean(onClick)}
      zIndexOffset={active ? 1000 : kind === "user" ? 500 : 0}
      eventHandlers={eventHandlers}
    >
      {children}
    </Marker>
  );
}

// Leaflet measures its container once, at mount. Inside a Dialog or Tabs the
// open animation resizes it afterwards, which leaves grey tiles; re-measure
// once it has settled.
export function InvalidateSize({ delay = 250 }: { delay?: number }) {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), delay);
    return () => clearTimeout(t);
  }, [map, delay]);

  return null;
}

export type DraggablePinProps = {
  position: LatLng;
  // false: dashed "drag me" pin for a spot the owner hasn't chosen yet.
  placed?: boolean;
  // Called on dragend and on map clicks. Return false to reject the spot; the
  // pin then snaps back to `position`.
  onMove: (lat: number, lng: number) => boolean | void;
};

// The owner's location-picker pin. Clicking the map moves it too.
export function DraggablePin({
  position,
  placed = true,
  onMove,
}: DraggablePinProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const onMoveRef = useRef(onMove);
  const [lat, lng] = position;

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const move = useCallback(
    (next: L.LatLng) => {
      if (onMoveRef.current(next.lat, next.lng) === false) {
        markerRef.current?.setLatLng([lat, lng]);
      }
    },
    [lat, lng],
  );

  const mapHandlers = useMemo(
    () => ({ click: (e: L.LeafletMouseEvent) => move(e.latlng) }),
    [move],
  );
  useMapEvents(mapHandlers);

  const markerHandlers = useMemo(
    () => ({
      dragend: (e: L.LeafletEvent) => move((e.target as L.Marker).getLatLng()),
    }),
    [move],
  );

  const icon = useMemo(
    () => salonPin({ active: placed, approximate: !placed }),
    [placed],
  );

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      draggable
      autoPan
      zIndexOffset={1000}
      title="Salon location"
      eventHandlers={markerHandlers}
    >
      {!placed && (
        <Tooltip permanent direction="right" offset={[12, -20]}>
          Drag me
        </Tooltip>
      )}
    </Marker>
  );
}
