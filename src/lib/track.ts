/**
 * Cookieless discovery counts. `track(name, dim)` queues an allow-listed event
 * and the queue goes to `/api/t` every 5 s, or when the page is hidden, with
 * `navigator.sendBeacon`. Nothing is sent with Do Not Track, Global Privacy
 * Control or an automated browser. No cookie, no id, no URL: the API keeps
 * per-day counts only.
 *
 * The allow-list mirrors the API's `modules/Analytics/analytics.events.ts`;
 * change both together. A value off the list is dropped there and counted as
 * rejected.
 */

type Page = "home" | "salons" | "salon" | "ai" | "about" | "contact" | "owner" | "other";
type Ref = "search" | "social" | "direct" | "internal" | "other";

export type TrackEvents = {
  page_view: `page:${Page},ref:${Ref}`;
  salon_list_viewed: `mode:${"list" | "map"}`;
  search_submitted: `source:${"hero" | "navbar" | "salons_page"}`;
  salon_viewed: `salon:${string}`;
  booking_started: "";
  slot_selected: "";
  assistant_opened: `entry:${"launcher" | "other"}`;
  hair_tryon_opened: "";
  signup_started: `method:${"email" | "google"}`;
};

export type TrackEvent = keyof TrackEvents;
type WithoutDim = { [K in TrackEvent]: TrackEvents[K] extends "" ? K : never }[TrackEvent];
type WithDim = Exclude<TrackEvent, WithoutDim>;

const ENDPOINT = "/api/t";
const FLUSH_MS = 5_000;
const MAX_BATCH = 20;
// The same event twice inside this window is one event: React's dev Strict
// Mode runs mount effects twice, and a quick re-render must not double-count.
const DEDUPE_MS = 1_000;

const queue: Array<{ name: string; dim?: string }> = [];
const lastSeen = new Map<string, number>();
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

const optedOut = () => {
  if (typeof navigator === "undefined" || typeof window === "undefined") return true;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return (
    nav.doNotTrack === "1" ||
    (window as Window & { doNotTrack?: string }).doNotTrack === "1" ||
    nav.globalPrivacyControl === true ||
    nav.webdriver === true
  );
};

const send = (events: typeof queue) => {
  const body = JSON.stringify({ events });
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  void fetch(ENDPOINT, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {});
};

export const flush = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  while (queue.length) send(queue.splice(0, MAX_BATCH));
};

const listen = () => {
  if (listening) return;
  listening = true;
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
};

export function track(name: WithoutDim): void;
export function track<K extends WithDim>(name: K, dim: TrackEvents[K]): void;
export function track(name: TrackEvent, dim?: string) {
  if (optedOut()) return;
  const key = `${name}|${dim ?? ""}`;
  const now = Date.now();
  if (now - (lastSeen.get(key) ?? 0) < DEDUPE_MS) return;
  lastSeen.set(key, now);
  listen();
  queue.push(dim ? { name, dim } : { name });
  if (queue.length >= MAX_BATCH) flush();
  else if (!timer) timer = setTimeout(flush, FLUSH_MS);
}
