"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { ApiResponse } from "@/lib/api-types";

/**
 * A queue's writes: the row leaves the list as soon as the decision is made
 * (when it leaves this view at all) and comes back if the API refused. The
 * server's `updateTag` then brings the fresh list.
 */
export function useQueueAction<R extends { id: string }>(items: R[]) {
  const [rows, drop] = useOptimistic(items, (state, id: string) => state.filter((r) => r.id !== id));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const act = <T,>(id: string, leaves: boolean, action: () => Promise<ApiResponse<T>>) =>
    new Promise<ApiResponse<T>>((resolve) => {
      setPendingId(id);
      startTransition(async () => {
        if (leaves) drop(id);
        const result = await action();
        setPendingId((current) => (current === id ? null : current));
        resolve(result);
      });
    });

  return { rows, pendingId, act };
}
