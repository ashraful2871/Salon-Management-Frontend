"use client";

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { MetricUnit, SeriesPoint } from "@/services/admin/analytics/types";
import { formatDay, formatDayFull, formatMetric, formatTick } from "../format";
import { ChartTooltipBox, SeriesLegend } from "./ChartTooltipBox";

const ACCENT = "var(--chart-1)";
const GREY = "var(--muted-foreground)";

type Row = { day: string; value: number | null; otherDay?: string; other?: number | null };

/**
 * A trend over time: one accent series, and optionally one grey comparison
 * (the previous period, or a sibling metric in the same unit). One y-axis,
 * always. The crosshair tooltip lists both, and arrow keys move it.
 */
export default function TrendLine({
  label,
  points,
  unit,
  comparison,
}: {
  label: string;
  points: SeriesPoint[];
  unit: MetricUnit;
  /** Aligned by position: day i of the comparison sits under day i of `points`. */
  comparison?: { label: string; points: SeriesPoint[]; showDay?: boolean };
}) {
  const data: Row[] = points.map((p, i) => ({
    day: p.day,
    value: p.value,
    ...(comparison && {
      otherDay: comparison.points[i]?.day,
      other: comparison.points[i]?.value ?? null,
    }),
  }));
  const config: ChartConfig = {
    value: { label, color: ACCENT },
    ...(comparison && { other: { label: comparison.label, color: GREY } }),
  };

  return (
    <div className="min-w-[480px] space-y-2">
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }} accessibilityLayer>
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
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltipBox
                  title={formatDayFull(row.day)}
                  rows={[
                    { key: "v", label, value: formatMetric(row.value, unit), swatch: ACCENT },
                    ...(comparison
                      ? [
                          {
                            key: "o",
                            label: comparison.label,
                            note:
                              comparison.showDay && row.otherDay
                                ? formatDayFull(row.otherDay)
                                : undefined,
                            value: formatMetric(row.other, unit),
                            swatch: GREY,
                          },
                        ]
                      : []),
                  ]}
                />
              );
            }}
          />
          {comparison && (
            <Line
              dataKey="other"
              name={comparison.label}
              stroke={GREY}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              isAnimationActive={false}
            />
          )}
          <Line
            dataKey="value"
            name={label}
            stroke={ACCENT}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
      {comparison && (
        <SeriesLegend
          items={[
            { label, swatch: ACCENT },
            { label: comparison.label, swatch: GREY },
          ]}
        />
      )}
    </div>
  );
}
