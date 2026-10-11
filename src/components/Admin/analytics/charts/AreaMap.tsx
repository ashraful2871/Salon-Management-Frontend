"use client";

import dynamic from "next/dynamic";
import { LeafletMap } from "@/components/Map/MapClient";
import type { AreaPoint } from "./AreaMapLayer";

const AreaMapLayer = dynamic(() => import("./AreaMapLayer"), { ssr: false });

/** Geography: one circle per area with a known centre. The card's table view lists every area. */
export default function AreaMap({ points }: { points: AreaPoint[] }) {
  return (
    <div className="h-72 min-w-[300px]">
      <LeafletMap className="h-full" zoom={12} interactive={false}>
        <AreaMapLayer points={points} />
      </LeafletMap>
    </div>
  );
}
