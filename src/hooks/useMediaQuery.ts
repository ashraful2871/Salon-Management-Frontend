"use client";

import { useCallback, useSyncExternalStore } from "react";

// False during SSR and hydration, then the live match. Use it to mount heavy
// widgets (like the map) only on the screens that show them, where a CSS
// `hidden` would still download and run them.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
