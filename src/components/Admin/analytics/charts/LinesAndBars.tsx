"use client";

import { Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { MetricUnit } from "@/services/admin/analytics/types";
import { formatDay, formatDayFull, formatMetric, formatTick } from "../format";
import { ChartTooltipBox, SeriesLegend } from "./ChartTooltipBox";

type Series = { key: string; label: string; color: string };

/**
 * Two counts as lines on the left axis and one amount as bars on a second
 * axis on the right (each axis keeps its own unit, so neither is read against
 * the other's scale). The palette is the validated `--chart-*` set; the
 * legend names every series in text ink.
 */
export default function LinesAndBars({
  rows,
  lines,
  bar,
  lineUnit = "count",
}: {
  /** One row per Dhaka day: `{ day, [series.key]: number }`. */
  rows: Array<{ day: string } & Record<string, number | string>>;
  lines: Series[];
  bar: Series & { unit: MetricUnit };
  lineUnit?: MetricUnit;
}) {
  const config: ChartConfig = Object.fromEntries(
    [...lines, bar].map((s) => [s.key, { label: s.label, color: s.color }]),
  );

  return (
    <div className="min-w-[480px] space-y-2">
      <ChartContainer config={config} className="aspect-auto h-60 w-full">
        <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} accessibilityLayer>
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
            yAxisId="lines"
            width={40}
            tickFormatter={(v: number) => formatTick(v, lineUnit)}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="bars"
            orientation="right"
            width={56}
            tickFormatter={(v: number) => formatTick(v, bar.unit)}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltipBox
                  title={formatDayFull(row.day)}
                  rows={[
                    ...lines.map((s) => ({
                      key: s.key,
                      label: s.label,
                      value: formatMetric(Number(row[s.key]), lineUnit),
                      swatch: s.color,
                    })),
                    { key: bar.key, label: bar.label, value: formatMetric(Number(row[bar.key]), bar.unit), swatch: bar.color },
                  ]}
                />
              );
            }}
          />
          <Bar
            yAxisId="bars"
            dataKey={bar.key}
            name={bar.label}
            fill={bar.color}
            fillOpacity={0.45}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          {lines.map((s) => (
            <Line
              key={s.key}
              yAxisId="lines"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ChartContainer>
      <SeriesLegend
        items={[
          ...lines.map((s) => ({ label: `${s.label} (left)`, swatch: s.color })),
          { label: `${bar.label} (bars, right)`, swatch: bar.color },
        ]}
      />
    </div>
  );
}
