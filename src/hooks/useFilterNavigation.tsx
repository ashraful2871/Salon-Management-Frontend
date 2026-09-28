"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import { startNavProgress } from "@/components/Shared/NavProgress";

type NavigateOptions = { scroll?: boolean };

type FilterNavigation = {
  /** Push a filter, date or page change without blanking what is on screen. */
  navigate: (url: string, options?: NavigateOptions) => void;
  /** True until the new URL's content is ready to replace the old. */
  isPending: boolean;
};

const FilterNavigationContext = createContext<FilterNavigation | null>(null);

const isCurrentUrl = (url: string) => {
  const target = new URL(url, window.location.href);
  return (
    target.pathname + target.search ===
    window.location.pathname + window.location.search
  );
};

// The push runs inside a transition, so React keeps the current page on screen
// until the new one has rendered instead of falling back to `loading.tsx`.
function useTransitionNavigation(): FilterNavigation {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (url: string, { scroll = false }: NavigateOptions = {}) => {
      if (!isCurrentUrl(url)) startNavProgress();
      startTransition(() => router.push(url, { scroll }));
    },
    [router],
  );

  return useMemo(() => ({ navigate, isPending }), [navigate, isPending]);
}

/**
 * Shares one navigation transition across a page, so the toolbar that starts
 * a change and the list that dims while it loads see the same `isPending`.
 */
export function FilterNavigationProvider({ children }: { children: ReactNode }) {
  const value = useTransitionNavigation();
  return (
    <FilterNavigationContext.Provider value={value}>
      {children}
    </FilterNavigationContext.Provider>
  );
}

/** The page's shared navigation, or a transition of its own outside a provider. */
export function useFilterNavigation(): FilterNavigation {
  const shared = useContext(FilterNavigationContext);
  const local = useTransitionNavigation();
  return shared ?? local;
}
