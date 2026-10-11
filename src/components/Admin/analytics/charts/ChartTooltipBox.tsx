import type { ReactNode } from "react";

export type TooltipRow = { key: string; label: string; value: string; swatch: string; note?: string };

/** The hover/focus card shared by the Recharts charts: a heading, then one line per series. */
export function ChartTooltipBox({ title, rows }: { title: ReactNode; rows: TooltipRow[] }) {
  return (
    <div className="min-w-40 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: r.swatch }} />
            <span className="flex-1 text-muted-foreground">
              {r.label}
              {r.note && <span className="block text-[11px]">{r.note}</span>}
            </span>
            <span className="font-medium tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Swatch + name in text ink: identity never rests on the colour alone. */
export function SeriesLegend({ items }: { items: Array<{ label: string; swatch: string }> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: i.swatch }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
