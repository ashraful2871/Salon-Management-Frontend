"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ApiResponse } from "@/lib/api-types";
import { getJob } from "@/services/home-service/getJob";
import { jobAbort } from "@/services/home-service/jobAbort";
import { jobArrived } from "@/services/home-service/jobArrived";
import { jobComplete } from "@/services/home-service/jobComplete";
import { jobEnRoute } from "@/services/home-service/jobEnRoute";
import { jobNoShow } from "@/services/home-service/jobNoShow";
import { jobStart } from "@/services/home-service/jobStart";
import type { HomeAbortKind, HomeJob, HomeJobCompleteInput } from "@/services/home-service/types";
import { homeErrorMessage } from "../booking/errors";

type Patch = Partial<HomeJob>;
type Patches = Record<string, Patch>;
const NO_PATCHES: Patches = {};

/**
 * The expert's actions on their visits, built like `useAppointmentActions`:
 * each one changes its card at once, spins only that card and leaves the rest
 * usable. `INVALID_STATE` means the visit moved on elsewhere, so the card is
 * read again. `setJob` keeps a card's fresh copy; null drops a visit that's no
 * longer theirs.
 */
export const useJobActions = (setJob: (id: string, job: HomeJob | null) => void) => {
  const [patches, addPatch] = useOptimistic(
    NO_PATCHES,
    (current: Patches, change: { id: string; patch: Patch }) => ({
      ...current,
      [change.id]: { ...current[change.id], ...change.patch },
    }),
  );
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  // State only disables a button after a re-render; this closes the gap so a
  // fast double tap still sends one request.
  const inFlight = useRef(new Set<string>());

  const withPending = useCallback(
    (list: HomeJob[]) =>
      patches === NO_PATCHES ? list : list.map((j) => (patches[j.id] ? { ...j, ...patches[j.id] } : j)),
    [patches],
  );

  const reload = useCallback(
    async (id: string) => {
      const res = await getJob(id);
      if (res.success && res.data) setJob(id, res.data);
      else if (/not found/i.test(res.message)) setJob(id, null);
    },
    [setJob],
  );

  /** Nothing of the expert's on its way, so the list is safe to read again. */
  const idle = useCallback(() => inFlight.current.size === 0, []);

  const run = <T>(
    id: string,
    patch: Patch,
    action: () => Promise<ApiResponse<T>>,
    onResult: (res: ApiResponse<T>) => void | Promise<void>,
  ) => {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    setPendingIds((ids) => [...ids, id]);

    startTransition(async () => {
      addPatch({ id, patch });
      try {
        const res = await action();
        await onResult(res);
        if (res.errorCode === "INVALID_STATE") await reload(id);
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        inFlight.current.delete(id);
        setPendingIds((ids) => ids.filter((pending) => pending !== id));
      }
    });
  };

  /** A step that answers with the job itself. */
  const step = (done?: string) => (res: ApiResponse<HomeJob>) => {
    if (!res.success || !res.data) return void toast.error(homeErrorMessage(res));
    setJob(res.data.id, res.data);
    if (done) toast.success(done);
  };

  /** An end answers with the outcome, so the card is read back. */
  const ended = (id: string, done: string) => async (res: ApiResponse<unknown>) => {
    if (!res.success) return void toast.error(homeErrorMessage(res));
    await reload(id);
    toast.success(done);
  };

  return {
    withPending,
    reload,
    idle,
    isPending: (id: string) => pendingIds.includes(id),
    setOff: (id: string) => run(id, { status: "EN_ROUTE" }, () => jobEnRoute(id), step()),
    arrived: (id: string) => run(id, { status: "ARRIVED" }, () => jobArrived(id), step()),
    /** No optimistic change: only the server knows the code is right. */
    start: (id: string, code: string, onFailed: (res: ApiResponse<HomeJob>) => void) =>
      run(
        id,
        {},
        () => jobStart(id, code),
        (res) => {
          if (res.success && res.data) setJob(id, res.data);
          else onFailed(res);
        },
      ),
    complete: (id: string, input: HomeJobCompleteInput) =>
      run(id, { status: "COMPLETED" }, () => jobComplete(id, input), step("Visit complete. Well done!")),
    noShow: (id: string) => run(id, { status: "NO_SHOW" }, () => jobNoShow(id), ended(id, "Marked as not home")),
    abort: (id: string, kind: HomeAbortKind, reason: string) =>
      run(
        id,
        { status: "CANCELLED" },
        () => jobAbort(id, kind, reason),
        ended(id, kind === "SAFETY" ? "Visit ended. Our team has been told." : "Visit stopped"),
      ),
  };
};

export type JobActions = ReturnType<typeof useJobActions>;
