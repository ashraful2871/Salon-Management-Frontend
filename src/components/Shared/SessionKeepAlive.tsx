"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Renews the session for a tab that is sitting still.
 *
 * The proxy renews on navigation, which is enough while someone is clicking
 * around. It is not enough for the case that prompted all of this: a booking
 * half filled in, one page, open longer than the access token lives. This
 * schedules a renewal a couple of minutes before expiry so the rollover happens
 * underneath the user, with no redirect and nothing lost.
 *
 * Renders nothing.
 */

/** Renew this long before expiry, so a slow round trip still lands in time. */
const RENEW_BEFORE_MS = 2 * 60 * 1000;

/** Never hammer the endpoint, however odd the arithmetic comes out. */
const MIN_DELAY_MS = 30_000;

/** `setTimeout` treats delays past a signed 32-bit int as zero, and fires at once. */
const MAX_DELAY_MS = 2_147_483_647;

type KeepAliveResult = {
  authenticated: boolean;
  expiresAt: number | null;
};

const SessionKeepAlive = ({
  initialExpiresAt,
}: {
  initialExpiresAt: number | null;
}) => {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiresAtRef = useRef<number | null>(initialExpiresAt);
  const inFlightRef = useRef(false);
  const stoppedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Declared as a ref pair because the timer callback and the schedule call
  // each other; a plain pair of `useCallback`s cannot close that circle.
  const renewRef = useRef<() => void>(() => {});

  const schedule = useCallback((expiresAt: number | null) => {
    clearTimer();

    if (stoppedRef.current || expiresAt === null) return;

    const delay = Math.min(
      Math.max(expiresAt - RENEW_BEFORE_MS - Date.now(), MIN_DELAY_MS),
      MAX_DELAY_MS,
    );

    timerRef.current = setTimeout(() => renewRef.current(), delay);
  }, []);

  const renew = useCallback(async () => {
    if (stoppedRef.current || inFlightRef.current) return;

    inFlightRef.current = true;

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        cache: "no-store",
      });

      if (!response.ok) {
        // Treated as a transient failure, not a sign-out: retry on the floor.
        schedule(Date.now());
        return;
      }

      const result = (await response.json()) as KeepAliveResult;

      if (!result.authenticated) {
        // The session is genuinely over. Stop asking, and let the server
        // components re-render so the header and the page agree about it.
        stoppedRef.current = true;
        clearTimer();
        router.refresh();
        return;
      }

      expiresAtRef.current = result.expiresAt;
      schedule(result.expiresAt);
    } catch {
      schedule(Date.now());
    } finally {
      inFlightRef.current = false;
    }
  }, [router, schedule]);

  useEffect(() => {
    renewRef.current = () => void renew();
  }, [renew]);

  useEffect(() => {
    expiresAtRef.current = initialExpiresAt;
    stoppedRef.current = false;
    schedule(initialExpiresAt);

    /**
     * Timers are throttled in background tabs and do not run at all while the
     * machine is asleep, so a laptop closed for two hours wakes with a timer
     * that is long overdue. Checking on the way back to the foreground is what
     * makes the first click after waking work instead of failing.
     */
    const onVisible = () => {
      if (document.visibilityState !== "visible" || stoppedRef.current) return;

      const expiresAt = expiresAtRef.current;

      if (expiresAt === null || expiresAt - RENEW_BEFORE_MS <= Date.now()) {
        void renew();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [initialExpiresAt, renew, schedule]);

  return null;
};

export default SessionKeepAlive;
