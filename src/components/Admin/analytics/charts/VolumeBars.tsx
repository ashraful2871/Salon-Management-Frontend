"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { MetricUnit, SeriesPoint } from "@/services/admin/analytics/types";
import { formatDay, formatDayFull, formatMetric, formatTick } from "../format";
import { ChartTooltipBox } from "./ChartTooltipBox";

const HUE = "var(--chart-1)";

/** Daily volumes: one hue, 2 px between bars, a tooltip per bar (arrow keys move it). */
export default function VolumeBars({
  label,
  points,
  unit = "count",
  period = "day",
}: {
  label: string;
  points: SeriesPoint[];
  unit?: MetricUnit;
  /** "week": each point is the week starting that day. */
  period?: "day" | "week";
}) {
  const config: ChartConfig = { value: { label, color: HUE } };
  return (
    <div className="min-w-[480px]">
      <ChartContainer config={config} className="aspect-auto h-52 w-full">
        <BarChart
          data={points}
          barCategoryGap={2}
          margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tickMargin={8}
          />
          <YAxis
            width={56}
            tickFormatter={(v: number) => formatTick(v, unit)}
            tickLine={false}
            axisLine={false}
            allowDecimals={unit !== "count"}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as SeriesPoint | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltipBox
                  title={period === "week" ? `Week of ${formatDayFull(row.day)}` : formatDayFull(row.day)}
                  rows={[{ key: "v", label, value: formatMetric(row.value, unit), swatch: HUE }]}
                />
              );
            }}
          />
          <Bar dataKey="value" name={label} fill={HUE} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
