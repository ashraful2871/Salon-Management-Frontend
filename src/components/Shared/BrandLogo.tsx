import Image from "next/image";

import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The logo: the gold mark (`public/brand-mark.png`) and the product name as
 * text, so renaming the site (`NEXT_PUBLIC_SITE_NAME`) renames the logo too.
 * Size it with a font size in `className` (`text-2xl` …): the mark is drawn
 * relative to the name. The surrounding link carries the accessible name, so
 * this is decorative.
 */
export function BrandLogo({
  className,
  preload = false,
  inverted = false,
}: {
  className?: string;
  /** Above the fold (the navbar): fetch the mark early. */
  preload?: boolean;
  /** On a dark background. */
  inverted?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-[0.3em] text-2xl leading-none", className)}
      aria-hidden
    >
      <Image
        src="/brand-mark.png"
        alt=""
        width={253}
        height={160}
        sizes="64px"
        preload={preload}
        className="h-[1.3em] w-auto"
      />
      <span
        className={cn(
          "font-display font-bold tracking-tight",
          inverted ? "text-white" : "text-charcoal"
        )}
      >
        {SITE.name}
      </span>
    </span>
  );
}
