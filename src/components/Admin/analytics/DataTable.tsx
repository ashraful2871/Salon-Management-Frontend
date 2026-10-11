import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TableColumn<T> = {
  key: string;
  label: string;
  numeric?: boolean;
  render: (row: T) => ReactNode;
};

/**
 * The table twin of a chart: same numbers, `tabular-nums` so they line up.
 * Plain HTML, so it renders on the server and reads well in a screen reader.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  empty = "Nothing in this range.",
}: {
  caption: string;
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: string;
}) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <table className="w-full min-w-max text-sm tabular-nums">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted-foreground">
          {columns.map((c) => (
            <th key={c.key} scope="col" className={cn("px-2 py-2 font-medium", c.numeric && "text-right")}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={rowKey(row, i)} className="border-b border-border/60 last:border-0">
            {columns.map((c) => (
              <td key={c.key} className={cn("px-2 py-1.5", c.numeric && "text-right")}>
                {c.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
