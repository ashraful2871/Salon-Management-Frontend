"use client";

import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type Impact = {
  key: string;
  /** e.g. "Cancel 14 upcoming bookings and return ৳4,200" */
  label: ReactNode;
  detail?: ReactNode;
  /** Set when the consequence is optional: the admin ticks it in or out. */
  checked?: boolean;
};

const Text = ({ item }: { item: Impact }) => (
  <span>
    <span className="text-foreground">{item.label}</span>
    {item.detail && <span className="block text-xs text-muted-foreground">{item.detail}</span>}
  </span>
);

/**
 * What an action will do besides the obvious, shown before the admin
 * confirms. Optional consequences carry a checkbox; the parent owns the ticks
 * through `onCheckedChange`.
 */
export function ImpactPreview({
  items,
  onCheckedChange,
  title = "This will also",
  className,
}: {
  items: Impact[];
  onCheckedChange?: (key: string, checked: boolean) => void;
  title?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm", className)}>
      <p className="mb-2 flex items-center gap-1.5 font-semibold text-warning">
        <TriangleAlert aria-hidden="true" className="size-4" />
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key}>
            {typeof item.checked === "boolean" ? (
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  checked={item.checked}
                  onChange={(e) => onCheckedChange?.(item.key, e.target.checked)}
                />
                <Text item={item} />
              </label>
            ) : (
              <div className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                <Text item={item} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
