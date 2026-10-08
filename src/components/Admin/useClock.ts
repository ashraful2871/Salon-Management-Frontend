"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
};

/**
 * Now, rounded to 30 s and re-rendering on that beat, for "due in 5 h" and
 * "2FA ✓ 12 min". Null on the server and during hydration, so relative times
 * never mismatch: render nothing (or an absolute time) until it is set.
 */
export const useClock = () =>
  useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / TICK_MS) * TICK_MS,
    () => null,
  );
