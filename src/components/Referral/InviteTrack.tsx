"use client";

import { useEffect } from "react";

import { track, type TrackEvents } from "@/lib/track";

/** Counts one `referral_landing_view` for the state the invite page rendered. */
export function InviteTrack({ dim }: { dim: TrackEvents["referral_landing_view"] }) {
  useEffect(() => {
    track("referral_landing_view", dim);
  }, [dim]);
  return null;
}
