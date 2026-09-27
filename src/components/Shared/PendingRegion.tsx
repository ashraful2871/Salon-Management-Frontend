"use client";

import type { ReactNode } from "react";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";

/**
 * Keeps the current content on screen while a filter change loads, dimmed and
 * not clickable, instead of swapping it for a skeleton. Follows the nearest
 * `FilterNavigationProvider` unless `pending` is passed.
 */
export function PendingRegion({
  children,
  pending,
  className,
}: {
  children: ReactNode;
  pending?: boolean;
  className?: string;
}) {
  const { isPending } = useFilterNavigation();
  const busy = pending ?? isPending;

  return (
    <div
      aria-busy={busy}
      className={cn(
        "transition-opacity duration-150",
        busy && "pointer-events-none opacity-60",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A thin indeterminate bar, shown only while the navigation is pending. */
export function PendingBar({
  pending,
  className,
}: {
  pending?: boolean;
  className?: string;
}) {
  const { isPending } = useFilterNavigation();
  if (!(pending ?? isPending)) return null;

  return (
    <div
      aria-hidden="true"
      className={cn("h-0.5 overflow-hidden rounded-full bg-primary/15", className)}
    >
      <div className="h-full w-2/5 rounded-full bg-primary animate-pending-bar motion-reduce:animate-none" />
    </div>
  );
}
