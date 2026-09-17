"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Bot, Search, Loader2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SalonCard from "@/components/Shared/SalonCard";
import {
  searchAiSuggestions,
  type AiSalonMatch,
} from "@/services/ai/searchAiSuggestions";
import { formatBDT } from "@/lib/money";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop";

const EXAMPLE_PROMPTS = [
  "Cheap haircut in Dhanmondi",
  "Bridal makeup with good reviews",
  "Relaxing spa and massage near Gulshan",
  "Hair colouring under 2000 taka",
];

const isUsableImage = (img?: string) =>
  !!img &&
  img !== "null" &&
  img !== "undefined" &&
  (img.startsWith("http://") ||
    img.startsWith("https://") ||
    img.startsWith("/") ||
    img.startsWith("data:"));

/** Shapes a match into the props SalonCard expects, using the real service names. */
const toCardSalon = (salon: AiSalonMatch) => {
  const img = salon.images?.[0]?.trim();

  const location =
    [salon.area, salon.district, salon.city].filter(Boolean).join(", ") ||
    salon.address ||
    "Unknown";

  const serviceNames = (Array.isArray(salon.services) ? salon.services : [])
    .map((s) => s?.name)
    .filter(Boolean) as string[];

  return {
    id: salon.id,
    name: salon.name,
    rating: salon.rating ?? 0,
    reviews: salon.totalReviews ?? 0,
    location,
    image: isUsableImage(img) ? (img as string) : FALLBACK_IMAGE,
    services: serviceNames.length ? serviceNames : ["Service"],
    openNow: false,
  };
};

/**
 * Renders one match plus whatever extra detail the response happened to carry.
 *
 * `similarity` and `services` only exist on backends running the current AI
 * search; an older deployment returns a bare row. Every field below is treated
 * as optional so a stale backend degrades to a plain card instead of throwing.
 */
const SalonMatchCard = ({
  salon,
  index,
}: {
  salon: AiSalonMatch;
  index: number;
}) => {
  const services = Array.isArray(salon.services) ? salon.services : [];

  const prices = services
    .map((s) => Number(s?.priceMinor))
    .filter((p) => Number.isFinite(p));

  const similarity = Number(salon.similarity);
  const hasSimilarity = Number.isFinite(similarity);

  return (
    <div className="relative flex flex-col">
      <SalonCard salon={toCardSalon(salon)} index={index} />

      {(hasSimilarity || prices.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
          {hasSimilarity && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(similarity * 100)}% match
            </Badge>
          )}
          {prices.length > 0 && (
            <span className="text-xs text-muted-foreground">
              from {formatBDT(Math.min(...prices))} &middot;{" "}
              {services.length} service{services.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default function AiSearchInterface() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [salons, setSalons] = useState<AiSalonMatch[]>([]);
  const [searchedFor, setSearchedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);
    setSalons([]);
    setSearchedFor(null);

    try {
      const response = await searchAiSuggestions(trimmed);

      if (response.success && response.data) {
        setAiResponse(response.data.aiResponse);
        // Defensive: an older backend may omit or reshape this.
        setSalons(
          Array.isArray(response.data.salons) ? response.data.salons : [],
        );
        setSearchedFor(response.data.query ?? trimmed);
      } else {
        setError(response.message || "Failed to fetch AI suggestions.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(prompt);
  };

  const handleExample = (example: string) => {
    setPrompt(example);
    runSearch(example);
  };

  // A search that returned nothing still gets the assistant's explanation.
  const noMatches = searchedFor !== null && salons.length === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
      {/* Search Input Section */}
      <div className="max-w-3xl mx-auto space-y-5">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full transition-all duration-500 group-hover:bg-primary/30" />
          <div className="relative flex items-center bg-background border border-primary/30 rounded-full shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
            <div className="pl-6 text-primary">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Find me a relaxing massage salon with high ratings..."
              className="flex-1 h-16 border-none bg-transparent shadow-none text-lg px-6 focus-visible:ring-0 placeholder:text-muted-foreground/70"
            />
            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="h-12 mr-2 px-8 rounded-full shadow-gold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" /> Match
                </span>
              )}
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Try:
          </span>
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

      {/* Error State */}
      {error && (
        <div className="text-center p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {/* Results Section */}
      {(aiResponse || salons.length > 0) && (
        <div className="space-y-10 border-t border-border pt-12">
          {/* AI Response Text */}
          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm flex gap-4 md:gap-6 items-start max-w-4xl mx-auto"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  AI Suggestion
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {aiResponse}
                </div>
              </div>
            </motion.div>
          )}

          {/* No Matches */}
          {noMatches && (
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <SearchX className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                Nothing matched{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{searchedFor}&rdquo;
                </span>
                . Try one of the examples above, or name a service and an area.
              </p>
            </div>
          )}

          {/* Salons Grid */}
          {salons.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-display font-semibold text-foreground text-center">
                {salons.length} salon{salons.length === 1 ? "" : "s"} matched
                {searchedFor && (
                  <span className="block text-sm font-normal text-muted-foreground mt-1">
                    for &ldquo;{searchedFor}&rdquo;
                  </span>
                )}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salons.map((salon, index) => (
                  <SalonMatchCard key={salon.id} salon={salon} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
