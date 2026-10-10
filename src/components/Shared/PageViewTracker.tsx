"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track, type TrackEvents } from "@/lib/track";

/**
 * One `page_view` per public route change: which kind of page (from the route,
 * never the URL itself) and where the visit came from. Only the first view
 * reads `document.referrer`; later ones are in-site navigations.
 */

type Page = TrackEvents["page_view"] extends `page:${infer P},ref:${string}` ? P : never;
type Ref = TrackEvents["page_view"] extends `page:${string},ref:${infer R}` ? R : never;

const pageOf = (path: string): Page => {
  if (path === "/") return "home";
  if (path === "/salons") return "salons";
  if (path.startsWith("/salons/")) return "salon";
  if (path.startsWith("/ai-suggestions")) return "ai";
  if (path.startsWith("/about")) return "about";
  if (path.startsWith("/contact")) return "contact";
  if (path.startsWith("/become-salon-owner")) return "owner";
  return "other";
};

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|baidu|ecosia|brave)\./;
const SOCIAL = /(^|\.)(facebook|fb|instagram|t|twitter|x|linkedin|youtube|tiktok|whatsapp|messenger|reddit|pinterest|threads)\.(com|co|me|net)$/;

const refOf = (referrer: string): Ref => {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === window.location.hostname.replace(/^www\./, "")) return "internal";
    if (SEARCH.test(host)) return "search";
    if (SOCIAL.test(host) || host === "l.facebook.com" || host === "lm.facebook.com") return "social";
    return "other";
  } catch {
    return "other";
  }
};

export default function PageViewTracker() {
  const pathname = usePathname();
  // The last path counted: a re-run for the same path (Strict Mode) is skipped,
  // and only the very first view reads the referrer.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    const ref = lastPath.current === null ? refOf(document.referrer) : "internal";
    lastPath.current = pathname;
    track("page_view", `page:${pageOf(pathname)},ref:${ref}`);
  }, [pathname]);

  return null;
}
