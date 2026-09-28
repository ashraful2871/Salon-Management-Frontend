"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/** A dot that pulses while its parent <Link>'s navigation is in flight. Render it inside the Link. */
export function NavLinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full bg-primary transition-opacity",
        pending ? "opacity-100 motion-safe:animate-pulse" : "opacity-0",
        className,
      )}
    />
  );
}
