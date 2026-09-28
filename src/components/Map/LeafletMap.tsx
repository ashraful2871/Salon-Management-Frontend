"use client";

// Touches `window` at import time. Never import this file directly; use the
// `next/dynamic` wrappers in ./MapClient.
import "leaflet/dist/leaflet.css";
import "./map.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Loader2, LocateFixed, LocateOff, Locate } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { DHAKA_CENTER, type LatLng } from "@/lib/geo";
import { salonPin, searchCenter, userDot } from "./pin";

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
  // "center": the point a nearby search is measured from.
  kind?: "salon" | "user" | "center";
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
    () =>
      kind === "user"
        ? userDot()
        : kind === "center"
          ? searchCenter()
          : salonPin({ active, approximate }),
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
      zIndexOffset={active ? 1000 : kind === "salon" ? 0 : 500}
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

// A Leaflet control slot React can render into. Leaflet owns the element (so
// it stacks with the zoom and attribution controls in the same corner, and
// clicks on it never reach the map); React owns what goes inside.
function MapControl({
  position,
  children,
}: {
  position: L.ControlPosition;
  children: ReactNode;
}) {
  const map = useMap();
  const [element] = useState(() => {
    const div = L.DomUtil.create("div", "sm-map-control");
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    return div;
  });

  useEffect(() => {
    const control = new L.Control({ position });
    control.onAdd = () => element;
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, position, element]);

  return createPortal(children, element);
}

export type GeoFix = { lat: number; lng: number; accuracy: number };

export type LocateControlProps = {
  // The zoom to fly in to; a map already closer than this keeps its zoom.
  zoom?: number;
  // A fix the caller already has (from the location dialog's GPS button), so
  // the dot shows at once instead of after a second permission round trip.
  initialFix?: GeoFix | null;
  // Every time the control centres the map on the customer.
  onLocate?: (fix: GeoFix) => void;
  position?: L.ControlPosition;
};

// Accuracy rings wider than this say nothing useful and cover the map.
const MAX_ACCURACY_RING_M = 1500;
const ACCURACY_STYLE: L.PathOptions = {
  color: "#2563eb",
  weight: 1,
  opacity: 0.35,
  fillColor: "#2563eb",
  fillOpacity: 0.08,
};

/**
 * "Where am I" for any map: the first tap asks for the location and flies
 * there, then keeps a live blue dot (with its accuracy ring) following the
 * customer. Once they drag the map away the button goes hollow, and the next
 * tap brings the map back to them, like the one in every maps app.
 *
 * Never asks on its own: the browser prompt only appears from the tap.
 */
export function LocateControl({
  zoom = 16,
  initialFix = null,
  onLocate,
  position = "bottomright",
}: LocateControlProps) {
  const map = useMap();
  const [fix, setFix] = useState<GeoFix | null>(initialFix);
  const [status, setStatus] = useState<"idle" | "locating" | "live" | "error">(
    initialFix ? "live" : "idle",
  );
  // Whether the map is on the customer right now (filled vs hollow icon).
  const [centred, setCentred] = useState(Boolean(initialFix));

  const watchRef = useRef<number | null>(null);
  const fixRef = useRef<GeoFix | null>(initialFix);
  const flyOnFixRef = useRef(false);
  const onLocateRef = useRef(onLocate);

  useEffect(() => {
    onLocateRef.current = onLocate;
  }, [onLocate]);

  useEffect(
    () => () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    },
    [],
  );

  // A drag is the customer taking the map somewhere else.
  useMapEvents({ dragstart: () => setCentred(false) });

  const flyTo = useCallback(
    (f: GeoFix) => {
      map.flyTo([f.lat, f.lng], Math.max(map.getZoom(), zoom), {
        duration: 0.8,
      });
      setCentred(true);
      onLocateRef.current?.(f);
    },
    [map, zoom],
  );

  const startWatching = () => {
    if (watchRef.current != null) return;
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      setStatus("error");
      toast.error("This browser can't share your location here.");
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const next = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        };
        fixRef.current = next;
        setFix(next);
        setStatus("live");
        if (flyOnFixRef.current) {
          flyOnFixRef.current = false;
          flyTo(next);
        }
      },
      (error) => {
        // A late timeout while we already have a position is not worth a
        // word: the dot just stops moving until the next update.
        if (fixRef.current && error.code !== error.PERMISSION_DENIED) return;
        if (watchRef.current != null) {
          navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
        }
        flyOnFixRef.current = false;
        setStatus("error");
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? "Location access is blocked. Allow it in your browser settings, then try again."
            : "We couldn't find your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  };

  const onClick = () => {
    if (fixRef.current) {
      flyTo(fixRef.current);
      startWatching();
      return;
    }
    if (status === "locating") return;
    setStatus("locating");
    flyOnFixRef.current = true;
    startWatching();
  };

  const Icon =
    status === "locating"
      ? Loader2
      : status === "error"
        ? LocateOff
        : fix && centred
          ? LocateFixed
          : Locate;

  const label =
    status === "locating"
      ? "Finding your location"
      : fix
        ? "Show my location"
        : "Show my current location";

  return (
    <>
      {fix && fix.accuracy <= MAX_ACCURACY_RING_M && (
        <Circle
          center={[fix.lat, fix.lng]}
          radius={fix.accuracy}
          pathOptions={ACCURACY_STYLE}
          interactive={false}
        />
      )}
      {fix && (
        <Marker
          position={[fix.lat, fix.lng]}
          icon={userDot()}
          interactive={false}
          keyboard={false}
          zIndexOffset={600}
        />
      )}

      <MapControl position={position}>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          title={label}
          aria-busy={status === "locating"}
          className={cn(
            "grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-black/10 bg-white shadow-md transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
            fix && centred ? "text-blue-600" : "text-slate-700",
          )}
        >
          <Icon
            className={cn("h-5 w-5", status === "locating" && "animate-spin")}
            aria-hidden="true"
          />
        </button>
      </MapControl>
    </>
  );
}

// Reports the map centre: `onMoveStart` as soon as the map starts moving (for
// the "lifted pin" look) and `onMoveEnd` with the centre once it settles.
// `byUser` is true when the move began with a drag, not a flyTo.
export function CenterTracker({
  onMoveStart,
  onMoveEnd,
}: {
  onMoveStart?: () => void;
  onMoveEnd: (center: { lat: number; lng: number }, byUser: boolean) => void;
}) {
  const dragged = useRef(false);
  const handlers = useRef({ onMoveStart, onMoveEnd });

  useEffect(() => {
    handlers.current = { onMoveStart, onMoveEnd };
  }, [onMoveStart, onMoveEnd]);

  const map = useMapEvents({
    dragstart: () => {
      dragged.current = true;
    },
    movestart: () => handlers.current.onMoveStart?.(),
    moveend: () => {
      const { lat, lng } = map.getCenter();
      handlers.current.onMoveEnd({ lat, lng }, dragged.current);
      dragged.current = false;
    },
  });

  return null;
}
