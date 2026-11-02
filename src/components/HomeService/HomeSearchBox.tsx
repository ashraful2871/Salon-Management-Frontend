"use client";

import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, History, Loader2, Search, SearchX, X } from "lucide-react";

import { formatBDT } from "@/lib/money";
import { formatRating } from "@/lib/rating";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { searchHome } from "@/services/home-service/searchHome";
import type { HomeAudience, HomeSearchSuggestions } from "@/services/home-service/types";
import { CATEGORY_ICON, CATEGORY_LABEL } from "./content";
import { ExpertAvatar, kmText } from "./HomeCards";
import { useHomeUrl } from "./HomeListControls";

const MIN_CHARS = 2;
const MAX_CHARS = 60;
const DEBOUNCE_MS = 250;
const RECENT_MAX = 5;

const PLACEHOLDER: Record<HomeAudience, string> = {
  LADIES: "Search facial, mehedi, threading or an expert's name",
  GENTS: "Search haircut, beard, grooming or an expert's name",
};

// --- recent searches: a per-viewer convenience, so browser storage that may be absent ---

const recentKey = (audience: HomeAudience) => `sm_home_recent_${audience.toLowerCase()}`;

const readRecent = (audience: HomeAudience): string[] => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(recentKey(audience)) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
};

const writeRecent = (audience: HomeAudience, list: string[]) => {
  try {
    if (list.length) window.localStorage.setItem(recentKey(audience), JSON.stringify(list));
    else window.localStorage.removeItem(recentKey(audience));
  } catch {
    // Private mode or blocked storage: recent searches just aren't kept.
  }
};

const pushRecent = (audience: HomeAudience, term: string) => {
  const next = [term, ...readRecent(audience).filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, RECENT_MAX);
  writeRecent(audience, next);
  return next;
};

// --- highlighting: bold the parts of a name that start with a typed word ---

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({ text, query }: { text: string; query: string }) {
  const words = query
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((w) => w.length >= 1)
    .sort((a, b) => b.length - a.length);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "giu");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-transparent font-semibold text-foreground">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

type Option =
  | { kind: "query"; term: string }
  | { kind: "recent"; term: string }
  | { kind: "service"; item: HomeSearchSuggestions["services"][number] }
  | { kind: "expert"; item: HomeSearchSuggestions["experts"][number] };

type Status = "idle" | "loading" | "ready" | "error";

/**
 * The search on /home-service/ladies and /home-service/gents: services and
 * experts (by name, headline or salon) that reach the visitor's point, as a
 * WAI-ARIA combobox. Typing shows suggestions; Enter (or "Search for …")
 * puts `q` in the URL and the list below filters on it. A service suggestion
 * opens the experts who do it, an expert opens their profile.
 */
export function HomeSearchBox({
  audience,
  point,
  initialQuery,
}: {
  audience: HomeAudience;
  point: { lat: number; lng: number };
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navigate = useHomeUrl();
  const listId = useId();
  const statusId = useId();

  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<HomeSearchSuggestions | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const cacheRef = useRef(new Map<string, HomeSearchSuggestions>());

  // Back / forward or a chip changes `q` without remounting: follow the URL.
  const [syncedQuery, setSyncedQuery] = useState(initialQuery);
  if (syncedQuery !== initialQuery) {
    setSyncedQuery(initialQuery);
    setValue(initialQuery);
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const term = value.trim();
  const typing = term.length >= MIN_CHARS;

  const fetchSuggestions = (raw: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = raw.trim();
    const id = ++requestRef.current;
    if (q.length < MIN_CHARS) {
      setStatus("idle");
      setResult(null);
      return;
    }
    const key = q.toLowerCase();
    const cached = cacheRef.current.get(key);
    if (cached) {
      setResult(cached);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    timerRef.current = setTimeout(async () => {
      const res = await searchHome({ audience, lat: point.lat, lng: point.lng, q });
      if (id !== requestRef.current) return; // a newer keystroke won
      if (!res.success || !res.data) {
        setStatus("error");
        setResult(null);
        return;
      }
      cacheRef.current.set(key, res.data);
      setResult(res.data);
      setStatus("ready");
    }, DEBOUNCE_MS);
  };

  const options: Option[] = typing
    ? [
        { kind: "query", term },
        ...(status === "ready" && result
          ? [
              ...result.services.map((item) => ({ kind: "service" as const, item })),
              ...result.experts.map((item) => ({ kind: "expert" as const, item })),
            ]
          : []),
      ]
    : recent.map((t) => ({ kind: "recent" as const, term: t }));

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  /** Puts `q` in the URL: a new search starts on page 1, all categories, best match. */
  const submit = (raw: string) => {
    const q = raw.trim().slice(0, MAX_CHARS);
    close();
    inputRef.current?.blur();
    if (!q) {
      navigate({ q: null, sort: null, category: null });
      return;
    }
    setValue(q);
    setRecent(pushRecent(audience, q));
    track("search_submitted", "source:home_service");
    navigate({ q, sort: null, category: null });
  };

  const choose = (option: Option) => {
    if (option.kind === "query" || option.kind === "recent") return submit(option.term);
    close();
    inputRef.current?.blur();
    if (option.kind === "service") {
      // The experts who do this service, the way a service card opens them.
      const { name, category } = option.item;
      setValue(name);
      setRecent(pushRecent(audience, name));
      track("search_submitted", "source:home_service");
      navigate({ q: name, view: "expert", category, sort: null });
      return;
    }
    const p = new URLSearchParams({ lat: String(point.lat), lng: String(point.lng) });
    router.push(`/home-service/experts/${option.item.id}?${p}`);
  };

  const clear = () => {
    setValue("");
    fetchSuggestions("");
    setActive(-1);
    inputRef.current?.focus();
    if (searchParams.get("q")) navigate({ q: null, sort: null, category: null });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!options.length) return;
      e.preventDefault();
      setOpen(true);
      // -1 is the input itself: down from the last row, or up from the first, goes back to it.
      const step = e.key === "ArrowDown" ? 1 : -1;
      const n = options.length;
      setActive((i) => {
        const next = i + step;
        return next >= n ? -1 : next < -1 ? n - 1 : next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && options[active]) choose(options[active]);
      else submit(value);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        close();
      } else if (value) {
        e.preventDefault();
        clear();
      }
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;
  const showPanel = open && (typing || recent.length > 0);

  // One line for screen readers once suggestions settle.
  const announcement =
    !open || !typing
      ? ""
      : status === "loading"
        ? "Searching…"
        : status === "error"
          ? "Search is unavailable right now."
          : result
            ? result.services.length + result.experts.length
              ? `${result.totals.services} services and ${result.totals.experts} experts found. Use the arrow keys to choose.`
              : "No matches."
            : "";

  const services = options.flatMap((o, i) => (o.kind === "service" ? [{ o, i }] : []));
  const experts = options.flatMap((o, i) => (o.kind === "expert" ? [{ o, i }] : []));
  const recents = options.flatMap((o, i) => (o.kind === "recent" ? [{ o, i }] : []));

  const row = (i: number, children: ReactNode, className?: string) => (
    <li
      key={i}
      id={optionId(i)}
      role="option"
      aria-selected={active === i}
      onMouseEnter={() => setActive(i)}
      onClick={() => choose(options[i])}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground/90",
        active === i && "bg-primary-soft",
        className,
      )}
    >
      {children}
    </li>
  );

  const heading = (id: string, label: string, count?: number) => (
    <li id={id} role="presentation" className="px-3 pb-1 pt-3 text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      {label}
      {count != null && <span className="ml-1 tabular-nums">· {count}</span>}
    </li>
  );

  return (
    <div className="relative">
      <form
        role="search"
        aria-label="Search home services and experts"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface p-1.5 transition-colors focus-within:border-primary/60"
      >
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
            aria-describedby={statusId}
            aria-label="Search services or experts"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            maxLength={MAX_CHARS}
            placeholder={PLACEHOLDER[audience]}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setActive(-1);
              setOpen(true);
              fetchSuggestions(e.target.value);
            }}
            onFocus={() => {
              setRecent(readRecent(audience));
              setOpen(true);
              // The URL may have changed `value` since the last suggestions (cached ones return at once).
              if (value.trim().length >= MIN_CHARS) fetchSuggestions(value);
            }}
            onBlur={close}
            onKeyDown={onKeyDown}
            className="h-10 w-full min-w-0 rounded-full border-0 bg-transparent pl-10 pr-9 text-base text-foreground shadow-none outline-none placeholder:text-muted-foreground md:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {value && (
            <button
              type="button"
              aria-label="Clear search"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
              className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
        >
          <Search className="size-4 sm:hidden" aria-hidden />
          <span className="max-sm:sr-only">Search</span>
        </button>
      </form>

      <p id={statusId} aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!showPanel}
        // Keep focus in the input while a row is clicked.
        onMouseDown={(e) => e.preventDefault()}
        className="absolute inset-x-0 top-full z-30 mt-2 max-h-[min(28rem,60vh)] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-surface p-2 shadow-card"
      >
        {!typing && recents.length > 0 && (
          <>
            <li role="presentation" className="flex items-center justify-between px-3 pb-1 pt-2">
              <span className="text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Recent searches
              </span>
              <button
                type="button"
                onClick={() => {
                  writeRecent(audience, []);
                  setRecent([]);
                }}
                className="cursor-pointer text-xs font-semibold text-primary hover:underline"
              >
                Clear
              </button>
            </li>
            {recents.map(({ o, i }) =>
              row(
                i,
                <>
                  <History className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{o.kind === "recent" && o.term}</span>
                </>,
              ),
            )}
          </>
        )}

        {typing && (
          <>
            {row(
              0,
              <>
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  Search for <span className="font-semibold text-foreground">“{term}”</span>
                </span>
                {status === "loading" && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />}
              </>,
            )}

            {status === "ready" && result?.fuzzy && (
              <li role="presentation" className="px-3 pt-2 text-xs text-muted-foreground">
                No exact matches. Showing close matches.
              </li>
            )}

            {services.length > 0 && (
              <>
                {heading(`${listId}-svc`, "Services", result?.totals.services)}
                {services.map(({ o, i }) => {
                  if (o.kind !== "service") return null;
                  const Icon = CATEGORY_ICON[o.item.category];
                  return row(
                    i,
                    <>
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-hover">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          <Highlight text={o.item.name} query={term} />
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {CATEGORY_LABEL[o.item.category]} · {o.item.expertCount} expert
                          {o.item.expertCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        from <span className="font-semibold text-foreground">{formatBDT(o.item.minPriceMinor)}</span>
                      </span>
                    </>,
                  );
                })}
              </>
            )}

            {experts.length > 0 && (
              <>
                {heading(`${listId}-exp`, "Experts", result?.totals.experts)}
                {experts.map(({ o, i }) => {
                  if (o.kind !== "expert") return null;
                  const e = o.item;
                  return row(
                    i,
                    <>
                      <ExpertAvatar name={e.name} photo={e.photo} className="size-9 text-xs ring-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          <Highlight text={e.name} query={term} />
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {e.matchedService ? (
                            <>
                              <Highlight text={e.matchedService} query={term} /> ·{" "}
                            </>
                          ) : null}
                          {e.salon.name} · {kmText(e.distanceKm)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {e.totalReviews > 0 ? `★ ${formatRating(e.rating)}` : "New"}
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </>,
                  );
                })}
              </>
            )}

            {status === "ready" && result && !services.length && !experts.length && (
              <li role="presentation" className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <SearchX className="size-4 shrink-0" aria-hidden />
                {result.outOfArea
                  ? "No expert comes to this location yet."
                  : `No services or experts match “${term}”. Try a service like “${audience === "LADIES" ? "facial" : "haircut"}”.`}
              </li>
            )}
            {status === "error" && (
              <li role="presentation" className="px-3 py-3 text-sm text-muted-foreground">
                Suggestions are unavailable right now. Press Enter to search.
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
}
