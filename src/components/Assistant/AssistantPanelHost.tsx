"use client";

import { useEffect, useState } from "react";

import AssistantPanel from "./AssistantPanel";

/** Longer than the slowest close animation (globals.css, `data-chat-panel`):
 *  the fallback for a tab that never fires `animationend`. */
const EXIT_FALLBACK_MS = 400;

/**
 * The panel in its own chunk, loaded by `AssistantProvider` on first open (or
 * early via `preloadAssistantPanel`). On close it stays mounted as `closing`
 * until its exit animation ends, then unmounts.
 */
export default function AssistantPanelHost({ open }: { open: boolean }) {
  const [mounted, setMounted] = useState(open);
  // Opening mounts at once, in the same render, so the first frame drawn is
  // the start of the entry animation.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = window.setTimeout(() => setMounted(false), EXIT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  if (!mounted) return null;

  return <AssistantPanel closing={!open} onExited={() => setMounted(false)} />;
}
