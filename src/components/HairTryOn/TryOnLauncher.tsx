"use client";

import { track } from "@/lib/track";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HairCatalog } from "@/services/hairstyle/types";

// The panel (and Turnstile, the uploader and the slider inside it) is fetched
// on the first click only, so the home page ships none of it up front.
const TryOnPanel = dynamic(
  () => import("./TryOnPanel").then((m) => m.TryOnPanel),
  { ssr: false },
);

export function TryOnLauncher({
  catalog,
  enabled,
}: {
  catalog: HairCatalog | null;
  enabled: boolean;
}) {
  // `opened` mounts the panel once and keeps it mounted, so closing and
  // reopening keeps the photo and results. A photo saved in sessionStorage
  // from earlier in this tab reopens at the style step (the panel reads it).
  const [opened, setOpened] = useState(false);
  const [open, setOpen] = useState(false);

  if (!enabled || !catalog) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        Coming back soon
      </Button>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={() => {
          track("hair_tryon_opened");
          setOpened(true);
          setOpen(true);
        }}
      >
        <Sparkles aria-hidden />
        Try it with your photo
      </Button>
      {opened && <TryOnPanel catalog={catalog} open={open} onOpenChange={setOpen} />}
    </>
  );
}
