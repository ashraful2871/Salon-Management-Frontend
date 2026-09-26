"use client";

// The only entry point for maps. Leaflet touches `window`, so everything here
// is loaded client-side only, and only when a map is actually rendered.
import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LeafletMapProps } from "./LeafletMap";
import type { SalonsMapProps } from "./SalonsMap";

export type {
  DraggablePinProps,
  GeoFix,
  LeafletMapProps,
  LocateControlProps,
  PinMarkerProps,
} from "./LeafletMap";
export type { SalonsMapProps, SearchArea } from "./SalonsMap";

// The skeleton fills the parent, so give the map a sized parent
// (e.g. <div className="h-[200px]"><LeafletMap className="h-full" /></div>).
const DynamicLeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

const DynamicSalonsMap = dynamic(() => import("./SalonsMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

export const Recenter = dynamic(
  () => import("./LeafletMap").then((m) => m.Recenter),
  { ssr: false },
);

export const FitToPoints = dynamic(
  () => import("./LeafletMap").then((m) => m.FitToPoints),
  { ssr: false },
);

export const PinMarker = dynamic(
  () => import("./LeafletMap").then((m) => m.PinMarker),
  { ssr: false },
);

export const DraggablePin = dynamic(
  () => import("./LeafletMap").then((m) => m.DraggablePin),
  { ssr: false },
);

export const InvalidateSize = dynamic(
  () => import("./LeafletMap").then((m) => m.InvalidateSize),
  { ssr: false },
);

// Live "where am I" button + blue dot. A child of <LeafletMap>.
export const LocateControl = dynamic(
  () => import("./LeafletMap").then((m) => m.LocateControl),
  { ssr: false },
);

// Reports the map centre as the customer pans. A child of <LeafletMap>.
export const CenterTracker = dynamic(
  () => import("./LeafletMap").then((m) => m.CenterTracker),
  { ssr: false },
);

// If the map chunk fails to load or Leaflet throws, show a quiet placeholder
// instead of taking the surrounding page down with it.
class MapErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function MapUnavailable({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground",
        className,
      )}
    >
      Map unavailable
    </div>
  );
}

export function LeafletMap(props: LeafletMapProps) {
  return (
    <MapErrorBoundary fallback={<MapUnavailable className={props.className} />}>
      <DynamicLeafletMap {...props} />
    </MapErrorBoundary>
  );
}

// Clustered salon pins with "Search this area", for /salons. Give it a sized
// parent, as above.
export function SalonsMap(props: SalonsMapProps) {
  return (
    <MapErrorBoundary fallback={<MapUnavailable className={props.className} />}>
      <DynamicSalonsMap {...props} />
    </MapErrorBoundary>
  );
}
