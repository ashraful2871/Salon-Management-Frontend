import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionTone = "default" | "subtle" | "dark";

const TONE_CLASS: Record<SectionTone, string> = {
  default: "bg-background",
  subtle: "bg-surface-subtle border-y border-border/60",
  dark: "bg-charcoal text-white",
};

const SIZE_CLASS = {
  default: "py-14 md:py-20",
  compact: "py-10 md:py-14",
} as const;

// Phones and tablets swipe through one row (the next card peeks in to say
// so); from lg up the six cards sit in a 3 x 2 grid.
export const SNAP_ROW =
  "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden";
export const SNAP_ITEM =
  "w-[82%] max-w-[330px] shrink-0 snap-start sm:w-[46%] lg:w-auto lg:max-w-none";

/** One band of a public page: background, vertical rhythm and the gutter. */
export function Section({
  id,
  tone = "default",
  size = "default",
  labelledBy,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  tone?: SectionTone;
  size?: keyof typeof SIZE_CLASS;
  /** The id of the section's H2 (`SectionHeader`'s `titleId`). */
  labelledBy?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        TONE_CLASS[tone],
        SIZE_CLASS[size],
        id && "scroll-mt-20",
        className,
      )}
    >
      <div
        className={cn(
          "container mx-auto px-4 sm:px-6 lg:px-8",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** A section's overline, H2 and description, with an optional action. */
export function SectionHeader({
  overline,
  title,
  titleId,
  description,
  action,
  align = "left",
  tone = "default",
}: {
  overline?: ReactNode;
  title: ReactNode;
  titleId?: string;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  /** Pass the section's tone; only "dark" changes the colours. */
  tone?: SectionTone;
}) {
  const dark = tone === "dark";
  const center = align === "center";

  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 md:mb-10",
        center
          ? "items-center text-center"
          : "md:flex-row md:items-end md:justify-between md:gap-8",
      )}
    >
      <div className="min-w-0">
        {overline && (
          <p
            className={cn(
              "text-overline font-semibold uppercase tracking-[0.06em]",
              dark ? "text-gold-light" : "text-primary",
            )}
          >
            {overline}
          </p>
        )}
        <h2
          id={titleId}
          className={cn(
            "font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl",
            overline && "mt-2",
            dark ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-2 max-w-2xl text-base",
              center && "mx-auto",
              dark ? "text-white/75" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
