"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: (code: string) => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare's bot check, loaded as a plain script. Hands back a token, or
 * null when it expires. In development without a site key it passes "dev".
 *
 * `onError` gets Cloudflare's error code. 110200 means this hostname is not in
 * the widget's Hostname Management list (Cloudflare dashboard → Turnstile), the
 * usual cause after a domain change; "script" means api.js didn't load.
 */
export function Turnstile({
  onToken,
  onError,
}: {
  onToken: (token: string | null) => void;
  onError?: (code: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && !!window.turnstile,
  );
  // The latest callbacks, so the widget isn't re-rendered when they change.
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onTokenRef.current = onToken;
    onErrorRef.current = onError;
  }, [onToken, onError]);

  useEffect(() => {
    if (!SITE_KEY && process.env.NODE_ENV === "production") {
      onErrorRef.current?.("missing-site-key");
    }
  }, []);

  useEffect(() => {
    if (!SITE_KEY && process.env.NODE_ENV !== "production") {
      onTokenRef.current("dev");
    }
  }, []);

  useEffect(() => {
    if (!SITE_KEY || !loaded || !el.current || !window.turnstile) return;
    const id = window.turnstile.render(el.current, {
      sitekey: SITE_KEY,
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": (code) => {
        console.error(
          `[turnstile] error ${code} on ${window.location.hostname}` +
            (String(code) === "110200"
              ? " - add this hostname to the widget in Cloudflare → Turnstile"
              : ""),
        );
        onTokenRef.current(null);
        onErrorRef.current?.(String(code));
      },
    });
    return () => window.turnstile?.remove(id);
  }, [loaded]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setLoaded(true)}
        onError={() => onErrorRef.current?.("script")}
      />
      <div ref={el} className="min-h-[65px]" />
    </>
  );
}
