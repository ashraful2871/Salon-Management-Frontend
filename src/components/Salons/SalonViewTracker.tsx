"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Counts one `salon_viewed` for this salon (a per-day total; the id is not kept per visitor). */
export default function SalonViewTracker({ salonId }: { salonId: string }) {
  useEffect(() => {
    track("salon_viewed", `salon:${salonId}`);
  }, [salonId]);
  return null;
}
