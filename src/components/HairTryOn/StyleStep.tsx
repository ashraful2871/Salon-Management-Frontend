"use client";

import { useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/Shared/SafeImage";
import { cn } from "@/lib/utils";
import type { HairCatalog, HairStyleGroup } from "@/services/hairstyle/types";
import { HairstyleArt } from "./HairstyleArt";

const GROUPS: Array<{ id: HairStyleGroup | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
  { id: "curly", label: "Curly" },
  { id: "fade", label: "Fades" },
];

// The live model (Cloudinary gen_replace) only repaints the hair that is
// already there, so it can't add length. Long styles stay hidden until a
// provider that can is switched on.
const HIDDEN_GROUPS = new Set<HairStyleGroup>(["long"]);

/** Style and colour pickers. Generate lives in the panel's pinned footer. */
export function StyleStep({
  catalog,
  beforeUrl,
  styleId,
  colorId,
  onStyle,
  onColor,
  onChangePhoto,
}: {
  catalog: HairCatalog;
  beforeUrl: string;
  styleId: string | null;
  colorId: string;
  onStyle: (id: string) => void;
  onColor: (id: string) => void;
  onChangePhoto: () => void;
}) {
  const [group, setGroup] = useState<HairStyleGroup | "all">("all");

  const styles = catalog.styles.filter((s) => !HIDDEN_GROUPS.has(s.group));
  const groups = GROUPS.filter(
    (g) => g.id === "all" || styles.some((s) => s.group === g.id),
  );
  const shown = group === "all" ? styles : styles.filter((s) => s.group === group);
  const color = catalog.colors.find((c) => c.id === colorId);
  const tint = color?.swatch;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-subtle p-2.5">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          <SafeImage src={beforeUrl} alt="Your photo" fill unoptimized className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Your photo</p>
          <p className="text-xs text-muted-foreground">Ready. Pick a look below.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onChangePhoto}>
          <RefreshCw aria-hidden /> Change
        </Button>
      </div>

      <section aria-labelledby="tryon-colour">
        <div className="mb-2.5 flex items-baseline justify-between gap-2">
          <h3 id="tryon-colour" className="text-sm font-semibold text-foreground">
            Colour
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {color ? `${color.name} · ${color.nameBn}` : "Natural"}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-labelledby="tryon-colour"
          className="-mx-4 flex gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {catalog.colors.map((c) => {
            const selected = c.id === colorId;
            const natural = c.swatch === "transparent";
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={c.name}
                title={`${c.name} · ${c.nameBn}`}
                onClick={() => onColor(c.id)}
                className={cn(
                  "relative grid size-10 shrink-0 place-items-center rounded-full border border-black/10 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  selected && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
                  natural && "bg-surface-subtle text-[10px] font-semibold text-muted-foreground",
                )}
                style={natural ? undefined : { backgroundColor: c.swatch }}
              >
                {natural ? "Own" : null}
                {selected && !natural && <Check className="size-4 text-white" aria-hidden />}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="tryon-style">
        <h3 id="tryon-style" className="mb-2.5 text-sm font-semibold text-foreground">
          Style
        </h3>
        <div
          role="group"
          aria-label="Style groups"
          className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {groups.map((g) => {
            const count =
              g.id === "all" ? styles.length : styles.filter((s) => s.group === g.id).length;
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={group === g.id}
                onClick={() => setGroup(g.id)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                  group === g.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:bg-muted",
                )}
              >
                {g.label}
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    group === g.id ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="radiogroup"
          aria-labelledby="tryon-style"
          className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3"
        >
          {shown.map((s) => {
            const selected = s.id === styleId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onStyle(s.id)}
                className={cn(
                  "group relative min-w-0 overflow-hidden rounded-2xl border bg-surface text-left transition-[border-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  selected
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-primary/40 hover:shadow-card",
                )}
              >
                <div className="aspect-square overflow-hidden bg-primary-soft">
                  <HairstyleArt
                    styleId={s.id}
                    group={s.group}
                    hair={tint}
                    framing="thumb"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="px-2 py-1.5 sm:px-2.5 sm:py-2">
                  <p className="truncate text-[13px] font-semibold text-foreground sm:text-sm">
                    {s.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{s.nameBn}</p>
                </div>
                {selected && (
                  <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                    <Check className="size-4" aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Drawings show the shape of each cut. Your result is made from your own photo.
        </p>
      </section>
    </div>
  );
}
