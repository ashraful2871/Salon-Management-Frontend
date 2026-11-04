"use client";

import { useEffect } from "react";

/** How long to keep the target in view while the page above it settles. */
const SETTLE_MS = 4000;

/**
 * Arriving at a page with `#id` from another page, the browser jumps to the
 * target as soon as it exists, but sections above it (client-loaded nearby
 * salons, streamed top-rated salons) grow afterwards and push it down, so the
 * visitor lands somewhere else. This keeps the target in view while the page
 * grows, and lets go once the visitor scrolls themselves or it has settled.
 *
 * Same-page `#id` links don't remount this and are handled by the browser.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let done = false;
    const scroll = () => {
      if (done) return;
      document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
    };

    const observer = new ResizeObserver(scroll);
    const timer = window.setTimeout(() => stop(), SETTLE_MS);
    const userEvents = ["wheel", "touchmove", "keydown", "mousedown"] as const;

    function stop() {
      if (done) return;
      done = true;
      observer.disconnect();
      window.clearTimeout(timer);
      userEvents.forEach((e) => window.removeEventListener(e, stop));
    }

    userEvents.forEach((e) => window.addEventListener(e, stop, { passive: true }));
    scroll();
    observer.observe(document.body);

    return stop;
  }, []);

  return null;
}
