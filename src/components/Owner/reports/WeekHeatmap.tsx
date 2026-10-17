/**
 * Bookings by weekday × hour: one sequential hue, darker = busier. Only the
 * hours that ever have a booking are drawn, so a salon open 10–21 is not a
 * strip of empty night columns. Each cell carries its count for screen readers
 * and on hover; the table view next to it has the exact numbers.
 */
export function WeekHeatmap({ rows, grid }: { rows: string[]; grid: number[][] }) {
  const used = Array.from({ length: 24 }, (_, h) => h).filter((h) => grid.some((r) => (r[h] ?? 0) > 0));
  const max = Math.max(0, ...grid.flat());
  if (!used.length || max === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No bookings in this range.</p>;
  }
  const hours = Array.from({ length: used[used.length - 1] - used[0] + 1 }, (_, i) => used[0] + i);
  const label = (h: number) => `${String(h).padStart(2, "0")}:00`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-separate border-spacing-0.5 text-xs" aria-label="Bookings by weekday and hour">
        <thead>
          <tr>
            <th scope="col" className="w-10" />
            {hours.map((h) => (
              <th key={h} scope="col" className="font-normal text-muted-foreground">
                {h % 2 === 0 ? String(h).padStart(2, "0") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((day, d) => (
            <tr key={day}>
              <th scope="row" className="pr-1 text-left font-normal text-muted-foreground">
                {day}
              </th>
              {hours.map((h) => {
                const n = grid[d]?.[h] ?? 0;
                // 12%–100% of the hue: an empty cell stays visibly lighter than one booking.
                const strength = n ? 12 + Math.round((n / max) * 88) : 0;
                return (
                  <td
                    key={h}
                    title={`${day} ${label(h)}: ${n} booking${n === 1 ? "" : "s"}`}
                    aria-label={`${day} ${label(h)}: ${n}`}
                    className="h-6 rounded-sm"
                    style={{
                      background: n
                        ? `color-mix(in oklch, var(--chart-1) ${strength}%, var(--color-surface))`
                        : "var(--color-muted)",
                    }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Fewer</span>
        <span
          aria-hidden
          className="h-2 w-24 rounded-full"
          style={{ background: "linear-gradient(to right, color-mix(in oklch, var(--chart-1) 12%, var(--color-surface)), var(--chart-1))" }}
        />
        <span>More (max {max})</span>
      </div>
    </div>
  );
}
