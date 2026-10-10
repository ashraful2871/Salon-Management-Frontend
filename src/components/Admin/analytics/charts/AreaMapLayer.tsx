"use client";

import { CircleMarker, Tooltip } from "react-leaflet";

export type AreaPoint = { key: string; label: string; lat: number; lng: number; value: number; text: string };

/** Circle markers sized by volume (area ∝ value), one hue, a hairline surface ring. */
export default function AreaMapLayer({ points }: { points: AreaPoint[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <>
      {points.map((p) => (
        <CircleMarker
          key={p.key}
          center={[p.lat, p.lng]}
          radius={6 + Math.sqrt(p.value / max) * 22}
          // SVG attributes can't resolve var(): this is --chart-1 as hex.
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#f54900", fillOpacity: 0.7 }}
        >
          <Tooltip direction="top">
            <span className="font-medium">{p.label}</span>: {p.text}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
