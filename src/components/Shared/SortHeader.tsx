"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";

/** `?sort=key:asc|desc` read back as its parts; null when unsorted. */
export const parseSort = (value: string | null | undefined) => {
  const [key, dir] = (value ?? "").split(":");
  return key ? { key, dir: dir === "asc" ? ("asc" as const) : ("desc" as const) } : null;
};

/**
 * A `DataList` column header that sorts the server's list: it writes
 * `?sort=key:asc|desc` (dropping `page`) through `useFilterNavigation`, so the
 * rows stay on screen while the sorted page loads. First click is ascending.
 */
export function SortHeader({
  sortKey,
  label,
  align,
}: {
  sortKey: string;
  label: string;
  align?: "left" | "right";
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate } = useFilterNavigation();
  const current = parseSort(params.get("sort"));
  const dir = current?.key === sortKey ? current.dir : null;
  const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;

  const onClick = () => {
    const next = new URLSearchParams(params.toString());
    next.set("sort", `${sortKey}:${dir === "asc" ? "desc" : "asc"}`);
    next.delete("page");
    navigate(`${pathname}?${next}`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Sort by ${label}${dir ? `, now ${dir === "asc" ? "ascending" : "descending"}` : ""}`}
      className={cn(
        "-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dir && "text-foreground",
        align === "right" && "flex-row-reverse",
      )}
    >
      {label}
      <Icon aria-hidden="true" className={cn("size-3.5", !dir && "opacity-50")} />
    </button>
  );
}
