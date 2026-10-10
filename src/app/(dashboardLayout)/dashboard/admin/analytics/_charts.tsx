"use client";

import dynamic from "next/dynamic";

/*
 * The only door to the Recharts and Leaflet charts. They are imported here,
 * from admin route files, through next/dynamic, so no public page's bundle
 * carries Recharts. The placeholder holds the chart's height, so nothing jumps.
 */
const placeholder = (height: string) =>
  function ChartPlaceholder() {
    return <div aria-hidden className={`${height} min-w-[300px] rounded-lg bg-muted/40`} />;
  };

export const TrendLine = dynamic(() => import("@/components/Admin/analytics/charts/TrendLine"), {
  ssr: false,
  loading: placeholder("h-64"),
});

export const VolumeBars = dynamic(() => import("@/components/Admin/analytics/charts/VolumeBars"), {
  ssr: false,
  loading: placeholder("h-52"),
});

export const AreaMap = dynamic(() => import("@/components/Admin/analytics/charts/AreaMap"), {
  ssr: false,
  loading: placeholder("h-72"),
});
