"use client";

import { useEffect, useRef, useState } from "react";
import type { Appointment } from "@/lib/api-types";
import { getTodayQueue } from "@/services/appoinments/getTodayQueue";

const BACKOFF_MS = 60_000;
const FAILURES_BEFORE_BACKOFF = 3;

/**
 * Today's desk queue, kept current by polling only the queue while the tab is
 * visible. Fresh server data (a new `initial`, such as the page a mutation sent
 * back) always replaces the last poll, and `paused` holds polls back while a
 * mutation is in flight so an older answer can't undo its optimistic change.
 *
 * `updatedAt` is when the queue itself was last read (mount or poll). Data a
 * mutation brings back can be newer, so it never overstates freshness.
 */
export const useLiveQueue = (
  initial: Appointment[],
  intervalMs = 20_000,
  paused = false,
) => {
  const [queue, setQueue] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [synced, setSynced] = useState(initial);
  if (synced !== initial) {
    setSynced(initial);
    setQueue(initial);
  }

  // The timer outlives the render that scheduled it, so it reads these.
  const pausedRef = useRef(paused);
  // Bumped whenever the server hands over fresh data, so a poll that was
  // already in flight can't overwrite it with an older answer.
  const generation = useRef(0);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    generation.current += 1;
  }, [initial]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let inFlight = false;
    let stopped = false;

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(
        poll,
        failures >= FAILURES_BEFORE_BACKOFF ? BACKOFF_MS : intervalMs,
      );
    }

    async function poll() {
      // A hidden tab ends the loop; becoming visible starts it again.
      if (document.hidden) return;
      if (inFlight || pausedRef.current) return schedule();

      inFlight = true;
      const started = generation.current;
      let fresh: Appointment[] | null = null;
      try {
        const res = await getTodayQueue();
        if (res.success) fresh = res.data ?? [];
      } catch {
        // Offline, or the server is restarting: counts as a failed poll.
      }
      inFlight = false;
      if (stopped) return;

      if (fresh === null) {
        failures += 1;
      } else {
        failures = 0;
        if (started === generation.current && !pausedRef.current) {
          setQueue(fresh);
          setUpdatedAt(Date.now());
        }
      }
      schedule();
    }

    function pollNow() {
      if (document.hidden) return;
      clearTimeout(timer);
      void poll();
    }

    function onVisibilityChange() {
      if (document.hidden) clearTimeout(timer);
      else pollNow();
    }

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", pollNow);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", pollNow);
    };
  }, [intervalMs]);

  return { queue, updatedAt };
};
