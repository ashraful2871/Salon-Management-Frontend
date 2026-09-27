"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// One bar for the whole app, so the store lives at module level: link clicks
// (the listener below) and `useFilterNavigation` both start it, and the URL
// changing finishes it.
type ProgressState = {
  progress: number;
  visible: boolean;
  /** Set on a restart so the bar snaps back to the start instead of shrinking. */
  instant: boolean;
};

const IDLE: ProgressState = { progress: 0, visible: false, instant: true };
const TRICKLE_MS = 200;
const TRICKLE_CEILING = 0.9;
const SAFETY_MS = 10_000;

let state = IDLE;
const listeners = new Set<() => void>();
let trickleTimer: ReturnType<typeof setInterval> | undefined;
let fadeTimer: ReturnType<typeof setTimeout> | undefined;
let safetyTimer: ReturnType<typeof setTimeout> | undefined;

const setState = (next: ProgressState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function startNavProgress() {
  if (typeof window === "undefined") return;
  clearTimeout(fadeTimer);
  clearTimeout(safetyTimer);
  clearInterval(trickleTimer);

  // A second click mid-way keeps the bar where it is; a finished or hidden
  // bar starts over.
  if (!state.visible || state.progress >= 1) {
    setState({ progress: 0.08, visible: true, instant: true });
  }

  // Each tick closes a tenth of the gap to the ceiling, so it slows down
  // the longer the server takes and never looks finished before it is.
  trickleTimer = setInterval(() => {
    const { progress } = state;
    setState({
      progress: progress + (TRICKLE_CEILING - progress) * 0.1,
      visible: true,
      instant: false,
    });
  }, TRICKLE_MS);

  // A click that never changes the URL (an intercepted link, a failed
  // navigation) must not leave the bar crawling forever.
  safetyTimer = setTimeout(doneNavProgress, SAFETY_MS);
}

export function doneNavProgress() {
  clearInterval(trickleTimer);
  clearTimeout(safetyTimer);
  if (!state.visible) return;
  setState({ progress: 1, visible: true, instant: false });
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(
    () => setState({ progress: 1, visible: false, instant: false }),
    200,
  );
}

// Starts the bar for a plain left click on a same-origin link to another URL.
// Capture phase, and no `defaultPrevented` check: Next's <Link> cancels the
// native navigation to run its own.
function onDocumentClick(event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  if (!(event.target instanceof Element)) return;
  const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
  if (!anchor) return;
  if (anchor.target && anchor.target !== "_self") return;
  if (anchor.hasAttribute("download")) return;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  // Same page, or only the hash differs: nothing will load.
  if (
    url.pathname + url.search ===
    window.location.pathname + window.location.search
  ) {
    return;
  }
  startNavProgress();
}

export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const { progress, visible, instant } = useSyncExternalStore(
    subscribe,
    () => state,
    () => IDLE,
  );

  useEffect(() => {
    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, []);

  // The new URL has committed: the page it belongs to is on screen.
  useEffect(() => {
    doneNavProgress();
  }, [pathname, search]);

  return (
    <div
      aria-hidden="true"
      data-nav-progress=""
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[110] h-0.5 origin-left bg-primary ease-out",
        instant
          ? "transition-opacity duration-200"
          : "transition-[transform,opacity] duration-200",
      )}
      style={{ transform: `scaleX(${progress})`, opacity: visible ? 1 : 0 }}
    />
  );
}
