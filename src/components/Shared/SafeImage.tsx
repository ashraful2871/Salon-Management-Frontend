"use client";

// next/image for photos we don't control: salon covers and profile photos are
// URLs owners paste from any host. Hosts outside the allow-list and plain http
// load straight from the source (the optimizer would refuse them), and a src
// that is empty, malformed or fails to load shows the branded placeholder.
import Image, { type ImageProps, type StaticImageData } from "next/image";
import { useState } from "react";

import { usableImage } from "@/lib/salon-card";
import { cn } from "@/lib/utils";

// Keep in step with images.remotePatterns in next.config.ts.
const OPTIMIZED_HOSTS = new Set([
  "res.cloudinary.com",
  "images.unsplash.com",
  "i.ibb.co",
  "lh3.googleusercontent.com",
]);
const PLACEHOLDER = "/placeholder-salon.svg";

type Props = Omit<ImageProps, "src"> & {
  src?: string | StaticImageData | null;
};

// Local files stay optimized, and so do https URLs on an allowed host.
const isOptimizable = (src: string) => {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && OPTIMIZED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

const SafeImage = ({ src, alt, className, unoptimized, onError, ...rest }: Props) => {
  const resolved =
    typeof src === "object" && src !== null
      ? src
      : (usableImage(src) ?? PLACEHOLDER);
  // Remembers which src failed, so a new src gets a fresh try without an effect.
  const [failed, setFailed] = useState<string | StaticImageData | null>(null);
  const current = failed === resolved ? PLACEHOLDER : resolved;

  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      unoptimized={
        unoptimized || (typeof current === "string" && !isOptimizable(current))
      }
      className={cn("bg-muted", className)}
      onError={(event) => {
        if (current !== PLACEHOLDER) setFailed(resolved);
        onError?.(event);
      }}
    />
  );
};

export default SafeImage;
