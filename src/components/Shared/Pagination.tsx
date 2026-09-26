"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

type PageItem = number | "gap-left" | "gap-right";

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * 1 … 4 5 6 … 49. `siblings` pages either side of the current one; the first
 * and last are always shown, and a gap only ever replaces two or more pages
 * (a lone hidden page is shown instead of an ellipsis standing in for it).
 */
export function pageItems(
  page: number,
  totalPages: number,
  siblings = 1,
): PageItem[] {
  // first + last + current + siblings + two gaps
  const slots = siblings * 2 + 5;
  if (totalPages <= slots) return range(1, totalPages);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, totalPages);
  const leftGap = left > 3;
  const rightGap = right < totalPages - 2;
  const edge = 3 + siblings * 2;

  if (!leftGap && rightGap) return [...range(1, edge), "gap-right", totalPages];
  if (leftGap && !rightGap) {
    return [1, "gap-left", ...range(totalPages - edge + 1, totalPages)];
  }
  return [1, "gap-left", ...range(left, right), "gap-right", totalPages];
}

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** With `pageSize`, adds "Showing 13–24 of 583 salons". */
  total?: number;
  pageSize?: number;
  /** Plural noun for the summary line. */
  itemLabel?: string;
  className?: string;
};

const baseButton =
  "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  total,
  pageSize,
  itemLabel = "results",
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const go = (next: number) => {
    if (next < 1 || next > totalPages || next === page || disabled) return;
    onPageChange(next);
  };

  const renderItems = (items: PageItem[]) =>
    items.map((item) =>
      typeof item === "number" ? (
        <li key={item}>
          <button
            type="button"
            onClick={() => go(item)}
            disabled={disabled}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            className={cn(
              baseButton,
              "px-3",
              item === page
                ? "border-transparent bg-primary text-primary-foreground shadow-gold"
                : "border-border bg-background text-foreground hover:border-gold/50 hover:bg-gold/5",
            )}
          >
            {item}
          </button>
        </li>
      ) : (
        <li
          key={item}
          aria-hidden="true"
          className="grid h-10 w-8 place-items-center text-muted-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </li>
      ),
    );

  const summary =
    total != null && pageSize
      ? {
          from: (page - 1) * pageSize + 1,
          to: Math.min(page * pageSize, total),
        }
      : null;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col items-center gap-4 sm:flex-row sm:justify-between",
        className,
      )}
    >
      {summary ? (
        <p className="order-last text-sm text-muted-foreground sm:order-first">
          Showing{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {summary.from}–{summary.to}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {total}
          </span>{" "}
          {itemLabel}
        </p>
      ) : (
        <p className="order-last text-sm text-muted-foreground sm:order-first">
          Page <span className="font-semibold text-foreground">{page}</span> of{" "}
          {totalPages}
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
          className={cn(
            baseButton,
            "gap-1 border-border bg-background px-3 text-foreground hover:border-gold/50 hover:bg-gold/5",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden md:inline">Previous</span>
        </button>

        {/* Phones get the current page and the two ends; wider screens a
            neighbour either side as well. */}
        <ul className="flex items-center gap-1.5 sm:hidden">
          {renderItems(pageItems(page, totalPages, 0))}
        </ul>
        <ul className="hidden items-center gap-1.5 sm:flex">
          {renderItems(pageItems(page, totalPages, 1))}
        </ul>

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Next page"
          className={cn(
            baseButton,
            "gap-1 border-border bg-background px-3 text-foreground hover:border-gold/50 hover:bg-gold/5",
          )}
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
