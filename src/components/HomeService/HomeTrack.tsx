"use client";

import Link from "next/link";
import { useEffect, type ComponentProps } from "react";

import { track, type TrackEvents } from "@/lib/track";
import type { HomeAudience } from "@/services/home-service/types";
import { trackSide } from "./content";

type ViewEvent = "home_view" | "home_expert_view" | "home_out_of_area";

/** Counts one view when it mounts; renders nothing, so a static page stays static. */
export function HomeTrack<K extends ViewEvent>({ event, dim }: { event: K; dim: TrackEvents[K] }) {
  useEffect(() => {
    track(event, dim);
  }, [event, dim]);
  return null;
}

/** A link to one side of Home Service that counts the pick (`home_side_select`). */
export function SideLink({
  audience,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { audience: HomeAudience }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track("home_side_select", trackSide(audience));
        onClick?.(e);
      }}
    />
  );
}
