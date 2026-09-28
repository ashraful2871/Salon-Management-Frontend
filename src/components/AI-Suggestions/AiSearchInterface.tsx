"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  Info,
  LocateFixed,
  MapPin,
  MessageSquare,
  Minus,
  Search,
  SearchX,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/Shared/EmptyState";
import { IconTile } from "@/components/Shared/FeatureCard";
import { PublicPageHero } from "@/components/Shared/PublicPageHero";
import SalonCard from "@/components/Shared/SalonCard";
import LocationDialog from "@/components/Location/LocationDialog";
import { useAssistantLauncher } from "@/components/Assistant/AssistantContext";
import { useLocateAndSave } from "@/hooks/useLocateAndSave";
import { useSavedLocation } from "@/hooks/useSavedLocation";
import { formatDistance } from "@/lib/geo";
import { formatBDT } from "@/lib/money";
import { usableImage } from "@/lib/salon-card";
import {
  searchAiSuggestions,
  type AiMatchType,
  type AiReason,
  type AiSalonMatch,
  type AiSearchData,
  type AiSearchIntent,
} from "@/services/ai/searchAiSuggestions";

const EXAMPLE_PROMPTS = [
  "Salon near me",
  "Cheap haircut in Dhanmondi",
  "Bridal makeup with good reviews",
  "Facial under 1500 taka",
  "Spa and massage in Gulshan",
];

// Must match the API's limit (ai.validation.ts).
const MAX_PROMPT_LENGTH = 300;

const SECTIONS: Array<{ type: AiMatchType; title: string; hint?: string }> = [
  { type: "best", title: "Best matches" },
  {
    type: "partial",
    title: "Close matches",
    hint: "Each meets part of what you asked for - the notes on the card say which part.",
  },
  {
    type: "alternative",
    title: "Popular alternatives",
    hint: "Nothing matched your search, so here are well-rated salons instead.",
  },
];

// The card already shows stars and the distance badge, and matched services
// are listed with their prices, so those reasons would only repeat them.
const REPEATED_ON_CARD = new Set<AiReason["kind"]>(["rating", "distance", "service"]);

// Same grid as the /salons list.
const RESULT_GRID = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

// After this long, the skeleton gets a "still working" line and a Cancel.
const SLOW_AFTER_MS = 4000;

// The contract chip; one swipe row on phones, wrapped from sm.
const EXAMPLE_CHIP =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft pointer-coarse:h-11 disabled:opacity-50 cursor-pointer";

/** What the search understood, as short chips: "Haircut", "In Dhanmondi", "Under ৳500". */
const intentChips = (
  intent?: AiSearchIntent,
  location?: AiSearchData["location"],
): string[] => {
  if (!intent) return [];
  const chips = intent.categories.map((c) => c.label);

  if (!chips.length) {
    intent.serviceTerms
      .slice(0, 2)
      .forEach((t) => chips.push(t.charAt(0).toUpperCase() + t.slice(1)));
  }

  if (intent.place) chips.push(`In ${intent.place}`);
  else if (intent.otherPlace) chips.push(`Near ${intent.otherPlace}`);
  else if (intent.nearMe) {
    chips.push(
      location?.used && location.source === "user" && location.label
        ? `Near ${location.label}`
        : "Near you",
    );
  }

  if (intent.minPriceMinor !== null && intent.maxPriceMinor !== null) {
    chips.push(`${formatBDT(intent.minPriceMinor)}–${formatBDT(intent.maxPriceMinor)}`);
  } else if (intent.maxPriceMinor !== null) {
    chips.push(`Under ${formatBDT(intent.maxPriceMinor)}`);
  } else if (intent.minPriceMinor !== null) {
    chips.push(`Over ${formatBDT(intent.minPriceMinor)}`);
  }
  if (intent.budget && intent.sortBy !== "price") chips.push("Budget-friendly");
  if (intent.minRating !== null) chips.push(`${intent.minRating}★ and up`);
  if (intent.openNow) chips.push("Open now");
  if (intent.sortBy === "rating") chips.push("Top rated first");
  if (intent.sortBy === "price") chips.push("Cheapest first");
  if (intent.sortBy === "distance") chips.push("Nearest first");

  return chips;
};

const toCardSalon = (salon: AiSalonMatch) => {
  const matched = salon.matchedServices ?? [];
  const names = [...matched, ...(salon.services ?? [])]
    .map((s) => s.name)
    .filter((name, i, all) => name && all.indexOf(name) === i);

  return {
    id: salon.id,
    name: salon.name,
    rating: salon.rating ?? 0,
    reviews: salon.totalReviews ?? 0,
    location:
      [salon.area, salon.district].filter((v) => v && v !== "N/A").join(", ") ||
      salon.address ||
      "Bangladesh",
    image: usableImage(salon.images?.[0]),
    services: names,
    openNow: salon.openNow ?? null,
  };
};

const SalonMatchCard = ({
  salon,
  index,
}: {
  salon: AiSalonMatch;
  index: number;
}) => {
  const matched = (salon.matchedServices ?? []).slice(0, 2);
  const reasons = (salon.reasons ?? []).filter((r) => !REPEATED_ON_CARD.has(r.kind));
  const missing = salon.missing ?? [];
  const { openWith, enabled: chatEnabled } = useAssistantLauncher();

  return (
    <div className="flex flex-col">
      <SalonCard
        salon={toCardSalon(salon)}
        index={index}
        distance={
          salon.distanceMeters != null
            ? formatDistance(salon.distanceMeters, salon.locationAccuracy === "APPROXIMATE")
            : undefined
        }
      />

      {(matched.length > 0 || reasons.length > 0 || missing.length > 0) && (
        <div className="mt-3 space-y-2 px-1">
          {matched.length > 0 && (
            <ul className="space-y-1" aria-label="Matching services">
              {matched.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate text-foreground">{service.name}</span>
                  <span className="shrink-0 font-semibold text-foreground">
                    {formatBDT(service.priceMinor)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason) => (
              <span
                key={`+${reason.kind}${reason.text}`}
                className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success"
              >
                <Check className="h-3 w-3" aria-hidden />
                {reason.text}
              </span>
            ))}
            {missing.map((reason) => (
              <span
                key={`-${reason.kind}${reason.text}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                <Minus className="h-3 w-3" aria-hidden />
                <span className="sr-only">Does not match: </span>
                {reason.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The search found it; the chat books it, with the salon already chosen. */}
      {chatEnabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            openWith({ type: "choose_salon", salonId: salon.id }, salon.name)
          }
          className="mt-3 w-full cursor-pointer gap-2"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          Continue in chat
        </Button>
      )}
    </div>
  );
};

const ResultsSkeleton = () => (
  <div className={RESULT_GRID} aria-hidden>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

export default function AiSearchInterface({ initialQuery }: { initialQuery?: string }) {
  const [prompt, setPrompt] = useState(initialQuery ?? "");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [result, setResult] = useState<AiSearchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  // Server Actions can't be aborted, so a stale or cancelled answer is dropped
  // on arrival: only the response whose id is still current is applied.
  const requestId = useRef(0);
  const ranInitialQuery = useRef(false);

  const savedLocation = useSavedLocation();
  const { locate, busy: locating, canAsk } = useLocateAndSave();

  // The cleanup clears the timer when loading ends, and on unmount.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  const runSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const id = ++requestId.current;
    setLoading(true);
    setSlow(false);
    setError(null);
    setLastQuery(trimmed);

    try {
      const response = await searchAiSuggestions(trimmed);
      if (id !== requestId.current) return;

      if (response.success && response.data) {
        setResult({
          ...response.data,
          // Defensive: an older API returns neither.
          salons: Array.isArray(response.data.salons) ? response.data.salons : [],
          query: response.data.query ?? trimmed,
        });
        // A shareable URL, without a navigation or a refetch.
        window.history.replaceState(null, "", `?q=${encodeURIComponent(trimmed)}`);
      } else {
        setResult(null);
        setError(response.message || "Failed to fetch AI suggestions.");
      }
    } catch (err) {
      if (id !== requestId.current) return;
      setResult(null);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setSlow(false);
      }
    }
  };

  // Stop waiting; the previous result (if any) stays on screen.
  const cancelSearch = () => {
    requestId.current++;
    setLoading(false);
    setSlow(false);
  };

  // ?q= runs once on arrival; the ref keeps React's dev double-mount from
  // searching twice.
  useEffect(() => {
    if (!initialQuery || ranInitialQuery.current) return;
    ranInitialQuery.current = true;
    void runSearch(initialQuery);
  }, [initialQuery]);

  // After the location changes, the last search is re-run from there.
  const rerunLastSearch = () => {
    if (result?.query) void runSearch(result.query);
  };

  const shareLocation = async () => {
    const saved = canAsk ? await locate() : null;
    if (saved) rerunLastSearch();
    else setLocationDialogOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(prompt);
  };

  const handleExample = (example: string) => {
    setPrompt(example);
    void runSearch(example);
  };

  const salons = result?.salons ?? [];
  const chips = intentChips(result?.intent, result?.location);
  const notes = result?.notes ?? [];

  return (
    <>
      <PublicPageHero
        size="compact"
        overline="AI Match"
        title="Describe it. We'll find the salon."
        description="Tell us the service, your budget and where you are, in your own words. AI Match suggests salons and services that fit."
      >
        <div className="mx-auto max-w-3xl space-y-4">
          <form
            onSubmit={handleSearch}
            role="search"
            className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-card transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-ring"
          >
            <Sparkles className="ml-2 size-5 shrink-0 text-primary" aria-hidden />
            <label htmlFor="ai-search" className="sr-only">
              Describe the salon or service you want
            </label>
            <Input
              id="ai-search"
              value={prompt}
              maxLength={MAX_PROMPT_LENGTH}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., haircut under 500 taka near me"
              className="h-12 min-w-0 flex-1 border-none bg-transparent px-2 text-base shadow-none focus-visible:ring-0 md:h-12 md:text-base"
            />
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={prompt.trim().length < 2}
            >
              {!loading && <Search aria-hidden />}
              Match
            </Button>
          </form>

          {/* Where "near me" is measured from */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" aria-hidden />
            {savedLocation ? (
              <>
                <span>
                  Searching near{" "}
                  <span className="font-medium text-foreground">{savedLocation.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLocationDialogOpen(true)}
                  className="font-medium text-primary underline-offset-4 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={shareLocation}
                disabled={locating}
                className="font-medium text-primary underline-offset-4 hover:underline cursor-pointer disabled:opacity-60"
              >
                {locating ? "Finding you…" : "Add your location for “near me” results"}
              </button>
            )}
          </div>

          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-sm font-medium text-muted-foreground">Try:</span>
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExample(example)}
                disabled={loading}
                className={EXAMPLE_CHIP}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </PublicPageHero>

      <section
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14"
        aria-label="AI Match results"
        aria-busy={loading}
      >
        {error && (
          <div
            role="alert"
            className="mb-8 flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger"
          >
            <span>{error}</span>
            {lastQuery && !loading && (
              <Button variant="link" size="sm" onClick={() => void runSearch(lastQuery)}>
                Try again
              </Button>
            )}
          </div>
        )}

        {loading && !result && <ResultsSkeleton />}

        {loading && slow && (
          <div className="mb-8 mt-6 flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
            <p role="status" className="text-sm text-muted-foreground">
              Still working. AI Match can take a few seconds…
            </p>
            <Button variant="ghost" size="sm" onClick={cancelSearch}>
              Cancel
            </Button>
          </div>
        )}

        {result && (
          <div className={`space-y-10 transition-opacity ${loading ? "opacity-50" : ""}`}>
            {/* What we understood + the assistant's reply */}
            <div className="flex max-w-3xl items-start gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <IconTile icon={Bot} />
              <div className="min-w-0 flex-1 space-y-3">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  What we understood
                </h2>
                {chips.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">We looked for:</span>
                    {chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-hover"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
                <p
                  className="text-muted-foreground leading-relaxed whitespace-pre-wrap"
                  aria-live="polite"
                >
                  {result.aiResponse}
                </p>
              </div>
            </div>

            {result.needsLocation && (
              <div className="flex max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-info-soft p-4 sm:flex-row sm:items-center">
                <LocateFixed className="h-5 w-5 shrink-0 text-info" aria-hidden />
                <p className="flex-1 text-sm text-foreground">
                  You asked for salons near you. Share your location and we&apos;ll sort
                  them by distance.
                </p>
                <Button variant="outline" size="sm" onClick={shareLocation} loading={locating}>
                  Use my location
                </Button>
              </div>
            )}

            {notes.length > 0 && (
              <div className="flex max-w-3xl gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                <Info className="h-5 w-5 shrink-0" aria-hidden />
                <ul className="space-y-1">
                  {notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {salons.length === 0 && (
              <EmptyState
                icon={SearchX}
                title={<>No salons matched &ldquo;{result.query}&rdquo;</>}
                description="Try one of the examples, or name a service and an area."
              />
            )}

            {SECTIONS.map(({ type, title, hint }) => {
              const group = salons.filter((s) => (s.matchType ?? "best") === type);
              if (!group.length) return null;

              return (
                <section key={type} aria-label={title}>
                  <div className="mb-5">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {title}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({group.length})
                      </span>
                    </h3>
                    {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
                  </div>
                  <div className={RESULT_GRID}>
                    {group.map((salon, index) => (
                      <SalonMatchCard key={salon.id} salon={salon} index={index} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        onDone={rerunLastSearch}
      />
    </>
  );
}
