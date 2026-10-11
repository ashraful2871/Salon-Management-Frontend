"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "n selected · actions · Clear" for a `DataList` with `selectable`. Render it
 * right after the list: it sticks to the bottom of the viewport while rows
 * are selected, above the phone's bottom tab bar and the home indicator.
 */
export function BulkActionBar({
  count,
  onClear,
  children,
  noun = "selected",
}: {
  count: number;
  onClear: () => void;
  /** The actions, as buttons. */
  children: ReactNode;
  noun?: string;
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mt-3 lg:bottom-4"
    >
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-lg sm:px-4">
        <p className="text-sm font-semibold tabular-nums" aria-live="polite">
          {count.toLocaleString()} {noun}
        </p>
        <span aria-hidden="true" className="text-muted-foreground">
          ·
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <X aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  );
}
