"use client";

import dynamic from "next/dynamic";

/*
 * Recharts reaches Reports only through next/dynamic, as on the admin
 * analytics page, so no public page's bundle carries it. The placeholder
 * holds the chart's height, so nothing jumps.
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
