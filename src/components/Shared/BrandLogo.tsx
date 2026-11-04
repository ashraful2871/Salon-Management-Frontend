import Image from "next/image";

import { cn } from "@/lib/utils";

/** The official wordmark, trimmed to its edges (1081 × 623). */
export const LOGO = { src: "/stylio-logo.png", width: 1081, height: 623 } as const;
/** The same wordmark with the black turned white, for dark backgrounds. */
const LOGO_LIGHT = "/stylio-logo-light.png";

/**
 * The official Stylio logo (`public/stylio-logo.png`, cut from
 * `public/Stylio Logo.png`). Size it with a font size in `className`
 * (`text-xl`, `text-2xl` …): the image is 1.8em tall, so the call sites that
 * sized the old mark + name keep working. The surrounding link carries the
 * accessible name, so this is decorative.
 */
export function BrandLogo({
  className,
  preload = false,
  inverted = false,
}: {
  className?: string;
  /** Above the fold (the navbar): fetch the logo early. */
  preload?: boolean;
  /** On a dark background. */
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center text-2xl leading-none", className)} aria-hidden>
      <Image
        src={inverted ? LOGO_LIGHT : LOGO.src}
        alt=""
        width={LOGO.width}
        height={LOGO.height}
        sizes="120px"
        preload={preload}
        className="h-[1.8em] w-auto"
      />
    </span>
  );
}
