"use client";
import { useSearchParams } from "next/navigation";

import { useFilterNavigation } from "@/hooks/useFilterNavigation";

/** The /salons URL as the filter bar and the results both change it. */
export function useSalonsUrl() {
  const searchParams = useSearchParams();
  const { navigate: pushUrl, isPending } = useFilterNavigation();

  // Every list change goes through the URL so it can be shared and undone
  // with back. Anything but a page turn starts again from page 1.
  const navigate = (
    changes: Record<string, string | null | undefined>,
    { keepPage = false } = {},
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!keepPage) params.delete("page");
    const qs = params.toString();
    // A page turn keeps the reader where the list starts rather than
    // throwing them back up to the search box.
    pushUrl(qs ? `/salons?${qs}` : "/salons", { scroll: !keepPage });
  };

  return { searchParams, navigate, isPending };
}
