"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Bot, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SalonCard from "@/components/Shared/SalonCard";
import { searchAiSuggestions } from "@/services/ai/searchAiSuggestions";

export default function AiSearchInterface() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [salons, setSalons] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);
    setSalons([]);

    try {
      const response = await searchAiSuggestions(prompt);
      if (response.success && response.data) {
        setAiResponse(response.data.aiResponse);
        // Normalize salons just like in Salons.tsx
        const normalizedSalons = (response.data.salons || []).map((salon: any) => {
          const fallbackImage = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop";
          const img = salon.images?.[0]?.trim();
          const firstImage = (
            img && 
            img !== "" && 
            img !== "null" && 
            img !== "undefined" &&
            (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/") || img.startsWith("data:"))
          )
            ? img
            : fallbackImage;

          const services = (salon.services || [])
            .filter((s: any) => s?.isActive !== false)
            .map((s: any) => s.name);

          const locationParts = [salon.city, salon.state].filter(Boolean);
          const location = locationParts.length
            ? locationParts.join(", ")
            : salon.address || "Unknown";

          return {
            id: salon.id,
            name: salon.name,
            rating: salon.rating ?? 0,
            reviews: salon.totalReviews ?? 0,
            location,
            image: firstImage,
            services: services.length ? services : ["Service"],
            openNow: false, // You might need isOpenNow logic here if required
          };
        });
        setSalons(normalizedSalons);
      } else {
        setError(response.message || "Failed to fetch AI suggestions.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
      {/* Search Input Section */}
      <div className="max-w-3xl mx-auto">
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
                <h3 className="text-lg font-semibold text-foreground">AI Suggestion</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {aiResponse}
                </div>
              </div>
            </motion.div>
          )}

          {/* Salons Grid */}
          {salons.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-display font-semibold text-foreground text-center">
                Recommended Salons
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salons.map((salon, index) => (
                  <SalonCard key={salon.id} salon={salon} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
