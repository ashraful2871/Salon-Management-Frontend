"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Check,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Minus,
  Search,
  SearchX,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import SalonCard from "@/components/Shared/SalonCard";
import LocationDialog from "@/components/Location/LocationDialog";
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
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
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
    </div>
  );
};

const ResultsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

export default function AiSearchInterface() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiSearchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const savedLocation = useSavedLocation();
  const { locate, busy: locating, canAsk } = useLocateAndSave();

  const runSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await searchAiSuggestions(trimmed);

      if (response.success && response.data) {
        setResult({
          ...response.data,
          // Defensive: an older API returns neither.
          salons: Array.isArray(response.data.salons) ? response.data.salons : [],
          query: response.data.query ?? trimmed,
        });
      } else {
        setResult(null);
        setError(response.message || "Failed to fetch AI suggestions.");
      }
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
      {/* Search */}
      <div className="max-w-3xl mx-auto space-y-5">
        <form onSubmit={handleSearch} className="relative group" role="search">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full transition-all duration-500 group-hover:bg-primary/30" />
          <div className="relative flex items-center bg-background border border-primary/30 rounded-full shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
            <div className="pl-5 sm:pl-6 text-primary">
              <Sparkles className="w-6 h-6 animate-pulse" aria-hidden />
            </div>
            <label htmlFor="ai-search" className="sr-only">
              Describe the salon or service you want
            </label>
            <Input
              id="ai-search"
              value={prompt}
              maxLength={MAX_PROMPT_LENGTH}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., haircut under 500 taka near me"
              className="flex-1 h-16 border-none bg-transparent shadow-none text-base sm:text-lg px-4 sm:px-6 focus-visible:ring-0 placeholder:text-muted-foreground/70"
            />
            <Button
              type="submit"
              disabled={loading || prompt.trim().length < 2}
              className="h-12 mr-2 px-5 sm:px-8 rounded-full shadow-gold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-label="Searching" />
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" aria-hidden /> Match
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Where "near me" is measured from */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-gold" aria-hidden />
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

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Try:</span>
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExample(example)}
              disabled={loading}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="text-center p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 max-w-2xl mx-auto"
        >
          {error}
        </div>
      )}

      {loading && !result && <ResultsSkeleton />}

      {result && (
        <div
          className={`space-y-10 border-t border-border pt-12 transition-opacity ${loading ? "opacity-50" : ""}`}
          aria-busy={loading}
        >
          {/* What we understood + the assistant's reply */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm flex gap-4 md:gap-6 items-start max-w-4xl mx-auto"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
              <Bot className="w-6 h-6 text-primary" aria-hidden />
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <h2 className="text-lg font-semibold text-foreground">AI Suggestion</h2>
              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">We looked for:</span>
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-foreground"
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
          </motion.div>

          {result.needsLocation && (
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
              <LocateFixed className="h-5 w-5 text-gold shrink-0" aria-hidden />
              <p className="flex-1 text-sm text-foreground">
                You asked for salons near you. Share your location and we&apos;ll sort
                them by distance.
              </p>
              <Button size="sm" onClick={shareLocation} disabled={locating}>
                {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Use my location"}
              </Button>
            </div>
          )}

          {notes.length > 0 && (
            <div className="max-w-4xl mx-auto flex gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <Info className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <ul className="space-y-1">
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {salons.length === 0 && (
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <SearchX className="w-10 h-10 text-muted-foreground mx-auto" aria-hidden />
              <p className="text-muted-foreground">
                Nothing matched{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{result.query}&rdquo;
                </span>
                . Try one of the examples above, or name a service and an area.
              </p>
            </div>
          )}

          {SECTIONS.map(({ type, title, hint }) => {
            const group = salons.filter((s) => (s.matchType ?? "best") === type);
            if (!group.length) return null;

            return (
              <section key={type} className="space-y-6" aria-label={title}>
                <div className="text-center">
                  <h3 className="text-2xl font-display font-semibold text-foreground">
                    {title}{" "}
                    <span className="text-base font-normal text-muted-foreground">
                      ({group.length})
                    </span>
                  </h3>
                  {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.map((salon, index) => (
                    <SalonMatchCard key={salon.id} salon={salon} index={index} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        onDone={rerunLastSearch}
      />
    </div>
  );
}
