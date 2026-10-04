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
      "error-callback"?: () => void;
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
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && !!window.turnstile,
  );
  // The latest callback, so the widget isn't re-rendered when it changes.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

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
      "error-callback": () => onTokenRef.current(null),
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
      />
      <div ref={el} className="min-h-[65px]" />
    </>
  );
}
