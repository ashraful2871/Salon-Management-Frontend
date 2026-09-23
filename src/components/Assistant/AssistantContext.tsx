"use client";

import { createContext, useContext } from "react";

import type { AssistantAction } from "@/lib/assistant-types";
import type { AssistantController } from "./useAssistant";

export type AssistantContextValue = {
  chat: AssistantController;
  isOpen: boolean;
  /** Open the panel, optionally running one action as it opens - this is the
   *  whole API the rest of the site needs ("Continue in chat", "Ask about this
   *  salon"). */
  openWith: (action?: AssistantAction, label?: string) => void;
  close: () => void;
};

export const AssistantContext = createContext<AssistantContextValue | null>(
  null,
);

/** The full controller. Only the panel and its blocks need this. */
export const useAssistantChat = (): AssistantContextValue => {
  const value = useContext(AssistantContext);
  if (!value) {
    throw new Error("useAssistantChat must be used inside <AssistantProvider>");
  }
  return value;
};

export type AssistantLauncherApi = {
  isOpen: boolean;
  openWith: (action?: AssistantAction, label?: string) => void;
  close: () => void;
};

/**
 * The entry points' view of the assistant. Outside the provider - a component
 * reused on a dashboard route, say - it falls back to the `/assistant` page, so
 * the button always does something rather than silently nothing.
 */
export const useAssistantLauncher = (): AssistantLauncherApi => {
  const value = useContext(AssistantContext);

  if (value) {
    return { isOpen: value.isOpen, openWith: value.openWith, close: value.close };
  }

  return {
    isOpen: false,
    openWith: () => {
      if (typeof window !== "undefined") window.location.assign("/assistant");
    },
    close: () => {},
  };
};
