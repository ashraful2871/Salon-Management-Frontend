"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TONE_CLASSES } from "@/lib/status-tone";
import { cn } from "@/lib/utils";

/**
 * A tiny inline-SVG trend line, no chart library. Scales to its box; the
 * colour is `currentColor`, so the parent's text colour sets it.
 */
export function Sparkline({
  values,
  className,
  label,
}: {
  values: number[];
  className?: string;
  /** Read out instead of the shape; omit to hide it from screen readers. */
  label?: string;
}) {
  if (values.length < 2) return null;
  const w = 100;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / range) * (h - 4)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-7 w-full overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export type KpiDelta = {
  /** "+12%" or "+৳4,200" */
  text: string;
  direction: "up" | "down" | "flat";
  /** Whether this direction is good news; colours the delta. Omit for neutral. */
  good?: boolean;
};

/**
 * One headline figure: label, value (proportional figures, as a headline
 * reads better than tabular ones), a delta whose arrow and words carry the
 * meaning - colour only repeats it - an optional sparkline and a definition
 * behind the info icon.
 */
export function KpiTile({
  label,
  value,
  delta,
  comparison = "vs previous period",
  spark,
  definition,
  className,
}: {
  label: string;
  value: string;
  delta?: KpiDelta;
  comparison?: string;
  spark?: number[];
  definition?: string;
  className?: string;
}) {
  const Arrow =
    delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : ArrowRight;
  const tone =
    delta?.good === undefined || delta.direction === "flat"
      ? TONE_CLASSES.neutral
      : delta.good
        ? TONE_CLASSES.success
        : TONE_CLASSES.danger;

  return (
    <Card className={cn("gap-2 py-4", className)}>
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center gap-1.5">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">{label}</p>
          {definition && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`What "${label}" means`}
                    className="rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Info aria-hidden="true" className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">{definition}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="font-display text-2xl font-semibold [font-variant-numeric:proportional-nums]">
          {value}
        </p>
        {delta && (
          <p className="flex flex-wrap items-center gap-x-1 text-xs">
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", tone.text)}>
              <Arrow aria-hidden="true" className="size-3.5" />
              <span className="sr-only">
                {delta.direction === "up" ? "Up" : delta.direction === "down" ? "Down" : "No change"}
              </span>
              {delta.text}
            </span>
            <span className="text-muted-foreground">{comparison}</span>
          </p>
        )}
        {spark && spark.length > 1 && (
          <Sparkline values={spark} className="text-primary" />
        )}
      </CardContent>
    </Card>
  );
}
