"use client";

import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompareSlider } from "./BeforeAfterSlider";
import { HairstyleArt, type Skin } from "./HairstyleArt";
import { BEFORE_ART } from "./hairArt";

// Illustrated looks only, so the home page shows no real person. The keys
// pick drawings in hairArt.ts; they are never sent to the API.
const LOOKS: Array<{
  art: string;
  name: string;
  hair?: string;
  skin: Skin;
  outfit: string;
}> = [
  { art: "textured-crop", name: "Textured crop", skin: "medium", outfit: "#3d3833" },
  { art: "high-fade-quiff", name: "Fade quiff", skin: "deep", outfit: "#1f3a4d" },
  { art: "curtain-bangs", name: "Curtain bangs", hair: "#7a4a2a", skin: "light", outfit: "#7c3a2d" },
  { art: "natural-curls", name: "Natural curls", hair: "#6b1f2e", skin: "medium", outfit: "#2f4a3a" },
  { art: "bob", name: "Bob", hair: "#3b2a20", skin: "deep", outfit: "#5b4a7a" },
];

/** The home page's before/after: sweeps on its own, drag to take over. */
export function HairTryOnDemo() {
  const [index, setIndex] = useState(0);
  // A look the visitor chose stays put; the sweep keeps going on it.
  const [pinned, setPinned] = useState(false);
  const look = LOOKS[index];

  const next = useCallback(() => {
    if (!pinned) setIndex((i) => (i + 1) % LOOKS.length);
  }, [pinned]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative rounded-[1.75rem] border border-border bg-surface p-2.5 shadow-card sm:p-3">
        <CompareSlider
          autoPlay
          onCycle={next}
          label={`Compare before and after: ${look.name}`}
          className="aspect-[4/5] rounded-[1.25rem]"
          before={
            <HairstyleArt
              key={`b-${index}`}
              art={BEFORE_ART}
              skin={look.skin}
              outfit={look.outfit}
              framing="portrait"
              className="bg-muted animate-in fade-in duration-500"
            />
          }
          after={
            <HairstyleArt
              key={`a-${index}`}
              styleId={look.art}
              hair={look.hair}
              skin={look.skin}
              outfit={look.outfit}
              framing="portrait"
              className="bg-primary-soft animate-in fade-in duration-500"
            />
          }
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <span
            aria-live="polite"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-foreground shadow-md"
          >
            <Sparkles className="size-4 text-primary" aria-hidden />
            {look.name}
          </span>
        </div>
      </div>

      <div
        role="group"
        aria-label="Example looks"
        className="mt-4 flex justify-center gap-2 sm:gap-3"
      >
        {LOOKS.map((l, i) => (
          <button
            key={l.art}
            type="button"
            aria-pressed={i === index}
            aria-label={l.name}
            title={l.name}
            onClick={() => {
              setIndex(i);
              setPinned(true);
            }}
            className={cn(
              "size-12 shrink-0 overflow-hidden rounded-full border-2 bg-primary-soft transition-[border-color,transform] duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:size-14",
              i === index ? "border-primary" : "border-surface shadow-sm",
            )}
          >
            <HairstyleArt
              styleId={l.art}
              hair={l.hair}
              skin={l.skin}
              outfit={l.outfit}
              framing="thumb"
            />
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Illustrations. Your preview is made from your own photo.
      </p>
    </div>
  );
}
