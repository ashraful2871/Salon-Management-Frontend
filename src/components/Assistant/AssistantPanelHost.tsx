"use client";

import { AnimatePresence } from "framer-motion";

import AssistantPanel from "./AssistantPanel";

/**
 * The panel and framer-motion in one chunk, loaded by `AssistantProvider` on
 * first open (or early via `preloadAssistantPanel`). It stays mounted after
 * that, so `AnimatePresence` can still play the exit animation.
 */
export default function AssistantPanelHost({ open }: { open: boolean }) {
  return <AnimatePresence>{open && <AssistantPanel />}</AnimatePresence>;
}
