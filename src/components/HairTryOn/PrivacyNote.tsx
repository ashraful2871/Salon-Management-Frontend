"use client";

import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

const POINTS: { label: string; text: string }[] = [
  { label: "What", text: "The photo you upload and the AI results made from it." },
  {
    label: "Where",
    // True while HAIR_IMAGE_PROVIDER=cloudinary (gen_replace edits the stored
    // photo in place). If the provider becomes `gemini`, say the photo is also
    // sent to Google's Gemini API only to create the edit.
    text: "Stored privately on Cloudinary, whose AI also makes the edit. It is sent nowhere else.",
  },
  {
    label: "How long",
    text: "Deleted automatically within 24 hours, or right away when you press “Delete my photo”.",
  },
  {
    label: "Never",
    text: "Used by us to train AI, shown publicly, or linked to an account.",
  },
  { label: "For fun", text: "The images are AI previews, not a promise of how a cut will look." },
  {
    label: "Links",
    text: "Your image links are private but don't expire on their own, so don't share them.",
  },
];

/** What happens to a try-on photo, opened from the consent line. */
export function PrivacyNote({ children }: { children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        data-vaul-no-drag
        className="w-80 max-w-[calc(100vw-2rem)] max-h-(--radix-popover-content-available-height) overflow-y-auto rounded-2xl bg-surface"
      >
        <PopoverTitle className="text-sm font-semibold text-foreground">
          Hairstyle try-on photos
        </PopoverTitle>
        <dl className="mt-3 space-y-2.5 text-sm">
          {POINTS.map((point) => (
            <div key={point.label}>
              <dt className="font-medium text-foreground">{point.label}</dt>
              <dd className="text-muted-foreground">{point.text}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
