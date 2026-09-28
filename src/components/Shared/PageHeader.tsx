import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A dashboard page's one title. Below lg the top bar already shows the page
 * name, so the h1 is kept for screen readers only.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        // Only the sr-only h1 is left on a phone: take no room there.
        !description && !actions && "max-lg:mb-0",
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-title-lg font-semibold tracking-tight max-lg:sr-only">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground lg:mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
