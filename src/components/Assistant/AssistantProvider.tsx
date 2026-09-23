"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";

import type { AssistantAction } from "@/lib/assistant-types";
import { AssistantContext, type AssistantContextValue } from "./AssistantContext";
import AssistantLauncher from "./AssistantLauncher";
import AssistantPanel from "./AssistantPanel";
import { useAssistant } from "./useAssistant";

/**
 * One chat for the whole site. `children` arrives as a prop from the server
 * layout, so its element identity is stable and a chat turn re-renders only the
 * panel and whatever else consumes this context - not every page beneath it.
 */
const AssistantProvider = ({ children }: { children: ReactNode }) => {
  const chat = useAssistant();
  const [isOpen, setIsOpen] = useState(false);

  const { open } = chat;

  const openWith = useCallback(
    (action?: AssistantAction, label?: string) => {
      setIsOpen(true);
      open(action, label);
    },
    [open],
  );

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<AssistantContextValue>(
    () => ({ chat, isOpen, openWith, close }),
    [chat, isOpen, openWith, close],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantLauncher />
      <AnimatePresence>{isOpen && <AssistantPanel />}</AnimatePresence>
    </AssistantContext.Provider>
  );
};

export default AssistantProvider;
