import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The top band of every public page except home: overline, H1, text, actions. */
export function PublicPageHero({
  overline,
  title,
  description,
  actions,
  children,
  align = "center",
  size = "default",
}: {
  overline?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons; they stretch to full width on phones. */
  actions?: ReactNode;
  /** Rendered under the actions, e.g. a search box. */
  children?: ReactNode;
  /** "left" left-aligns from lg; phones are always centred. */
  align?: "center" | "left";
  /** "compact" is the shorter band /salons uses. */
  size?: "default" | "compact";
}) {
  const compact = size === "compact";
  const left = align === "left";

  return (
    <section className="border-b border-border/60 bg-surface-subtle bg-glow-soft">
      <div
        className={cn(
          "container mx-auto px-4 sm:px-6 lg:px-8",
          compact ? "py-8 md:py-10" : "py-12 md:py-16 lg:py-20",
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center text-center",
            left && "lg:items-start lg:text-left",
          )}
        >
          {overline && (
            <p className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary">
              {overline}
            </p>
          )}
          <h1
            className={cn(
              "font-display font-bold tracking-tight text-balance text-foreground",
              compact
                ? "text-3xl md:text-4xl"
                : "text-3xl sm:text-4xl lg:text-5xl",
              overline && "mt-4",
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
          {actions && (
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {actions}
            </div>
          )}
          {children && (
            <div className={cn("w-full", compact ? "mt-6" : "mt-8")}>
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
