import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

/**
 * A small uppercase label between gold hairlines. "responsive" is centred on
 * phones and left-aligned from lg, like the hero copy.
 */
export function Overline({
  children,
  tone = "light",
  align = "left",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  align?: "left" | "center" | "responsive";
  className?: string;
}) {
  const rule = cn("h-px w-8 shrink-0", tone === "dark" ? "bg-gold-light/50" : "bg-gold/60");
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-overline font-semibold uppercase tracking-[0.2em]",
        tone === "dark" ? "text-gold-light" : "text-primary",
        align === "center" && "justify-center",
        align === "responsive" && "justify-center lg:justify-start",
        className,
      )}
    >
      <span aria-hidden className={rule} />
      {children}
      {align !== "left" && (
        <span aria-hidden className={cn(rule, align === "responsive" && "lg:hidden")} />
      )}
    </p>
  );
}

/** The overline, H2 and line of text every section of the page opens with. */
export function SectionHeading({
  overline,
  title,
  titleId,
  description,
  action,
  align = "left",
  tone = "light",
  className,
  children,
}: {
  overline: ReactNode;
  title: ReactNode;
  titleId: string;
  description?: ReactNode;
  /** Sits to the right of the heading from md (e.g. "See all"). */
  action?: ReactNode;
  align?: "left" | "center";
  tone?: Tone;
  className?: string;
  /** Rendered under the description, e.g. a button. */
  children?: ReactNode;
}) {
  const center = align === "center";
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "mb-10 md:mb-12",
        center && "text-center",
        action && "flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8",
        className,
      )}
    >
      <div className={cn("min-w-0", center && "mx-auto max-w-2xl")}>
        <Overline tone={tone} align={center ? "center" : "left"}>
          {overline}
        </Overline>
        <h2
          id={titleId}
          className={cn(
            "mt-4 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
            dark ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-3 max-w-xl text-base leading-relaxed sm:text-lg",
              center && "mx-auto",
              dark ? "text-white/75" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
