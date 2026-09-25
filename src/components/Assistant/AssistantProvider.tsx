"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";

import type { AssistantAction } from "@/lib/assistant-types";
import type { AssistantAccess } from "@/services/assistant/getAssistantAccess";
import { AssistantContext, type AssistantContextValue } from "./AssistantContext";
import AssistantLauncher from "./AssistantLauncher";
import AssistantPanel from "./AssistantPanel";
import { useAssistant } from "./useAssistant";

/**
 * One chat for the whole site. `children` arrives as a prop from the server
 * layout, so its element identity is stable and a chat turn re-renders only the
 * panel and whatever else consumes this context - not every page beneath it.
 *
 * With `access.enabled` false (the API's kill switch is off, or this visitor is
 * not on the rollout allowlist) nothing is drawn: no launcher, no panel, and
 * the entry points on other pages hide themselves.
 */
const AssistantProvider = ({
  children,
  access,
}: {
  children: ReactNode;
  access: AssistantAccess;
}) => {
  const chat = useAssistant();
  const [isOpen, setIsOpen] = useState(false);

  const { open } = chat;
  const { enabled } = access;

  const openWith = useCallback(
    (action?: AssistantAction, label?: string) => {
      if (!enabled) return;
      setIsOpen(true);
      open(action, label);
    },
    [enabled, open],
  );

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<AssistantContextValue>(
    () => ({ chat, isOpen, openWith, close, access }),
    [chat, isOpen, openWith, close, access],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      {enabled && <AssistantLauncher />}
      <AnimatePresence>{enabled && isOpen && <AssistantPanel />}</AnimatePresence>
    </AssistantContext.Provider>
  );
};

export default AssistantProvider;
