"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { SalonMoneyRow } from "@/services/admin/analytics/types";
import { formatMetric } from "./format";

type Key = "name" | "area" | "gmvMinor" | "completed";

const COLUMNS: Array<{ key: Key; label: string; numeric?: boolean }> = [
  { key: "name", label: "Salon" },
  { key: "area", label: "Area" },
  { key: "gmvMinor", label: "Completed value", numeric: true },
  { key: "completed", label: "Completed", numeric: true },
];

/** Salons in the range, sortable by any column; each links to its Salon 360. */
export function SalonLeaderboard({ rows }: { rows: SalonMoneyRow[] }) {
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "gmvMinor", dir: "desc" });
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No completed bookings in this range.</p>;
  }
  const sorted = [...rows].sort((a, b) => {
    const x = a[sort.key];
    const y = b[sort.key];
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return sort.dir === "asc" ? c : -c;
  });

  return (
    <table className="w-full min-w-max text-sm tabular-nums">
      <caption className="sr-only">Salon leaderboard</caption>
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th scope="col" className="px-2 py-2 font-medium">
            #
          </th>
          {COLUMNS.map((c) => {
            const active = sort.key === c.key;
            return (
              <th
                key={c.key}
                scope="col"
                aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                className={c.numeric ? "px-2 py-2 text-right font-medium" : "px-2 py-2 font-medium"}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSort((s) => ({
                      key: c.key,
                      dir: s.key === c.key ? (s.dir === "asc" ? "desc" : "asc") : c.numeric ? "desc" : "asc",
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {c.label}
                  {active &&
                    (sort.dir === "asc" ? (
                      <ArrowUp className="size-3" aria-hidden />
                    ) : (
                      <ArrowDown className="size-3" aria-hidden />
                    ))}
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map((s, i) => (
          <tr key={s.salonId} className="border-b border-border/60 last:border-0">
            <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
            <td className="px-2 py-1.5">
              <Link href={`/dashboard/admin/salons/${s.salonId}`} className="font-medium hover:underline">
                {s.name}
              </Link>
            </td>
            <td className="px-2 py-1.5">{s.area}</td>
            <td className="px-2 py-1.5 text-right">{formatMetric(s.gmvMinor, "minor")}</td>
            <td className="px-2 py-1.5 text-right">{formatMetric(s.completed, "count")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
