"use client";

import { useState, useTransition } from "react";
import { showResultToast } from "@/components/Shared/showResultToast";
import { turnOnHome } from "@/services/home-service/turnOnHome";
import type { HomeChecklistItem, OwnerHomeProfile } from "@/services/home-service/types";
import type { Sides } from "./format";

/**
 * Turn on, also how a side changes once it is on. A refused turn-on carries
 * the checklist as it stands for the sides asked for, which replaces the
 * page's until the server sends a fresh one.
 */
export const useTurnOn = (home: OwnerHomeProfile) => {
  const [refused, setRefused] = useState<{ failing: string[]; checklist: HomeChecklistItem[] } | null>(null);
  const [pending, start] = useTransition();

  const turnOn = (sides: Sides, before?: () => void) =>
    start(async () => {
      before?.();
      const res = await turnOnHome({ salonId: home.salon.id, ...sides });
      showResultToast(res);
      if (res.success) setRefused(null);
      else if (res.errorCode === "HOME_SERVICE_OFF_CHECKLIST") {
        const { failing, checklist } = (res.details ?? {}) as { failing?: string[]; checklist?: HomeChecklistItem[] };
        setRefused({ failing: failing ?? [], checklist: checklist ?? home.checklist });
      }
    });

  return { turnOn, pending, failing: refused?.failing ?? [], checklist: refused?.checklist ?? home.checklist };
};
