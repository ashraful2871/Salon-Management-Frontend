"use client";

import { useEffect, useState } from "react";
import { getTryOnJob } from "@/services/hairstyle/getTryOnJob";
import type { TryOnJob, TryOnJobStatus } from "@/services/hairstyle/types";

const POLL_MS = 2_000;
const STILL_WORKING_MS = 25_000;
const GIVE_UP_MS = 90_000;

export type PolledJob = Omit<TryOnJob, "status"> & {
  status: TryOnJobStatus | "TIMEOUT";
};

/**
 * Polls one job every 2 s while the tab is visible, until it is DONE or
 * FAILED. After 90 s it gives up with status "TIMEOUT". A retried job keeps
 * its id, so `attempt` is what restarts the polling.
 */
export function useTryOnJob(
  jobId: string | null,
  ownerToken: string | null,
  attempt = 0,
) {
  const [state, setState] = useState<{
    key: string | null;
    job: PolledJob | null;
    stillWorking: boolean;
  }>({ key: null, job: null, stillWorking: false });

  const key = jobId && ownerToken ? `${jobId}:${ownerToken}:${attempt}` : null;

  useEffect(() => {
    if (!jobId || !ownerToken) return;
    const startedAt = Date.now();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const thisKey = `${jobId}:${ownerToken}:${attempt}`;

    const finish = (job: PolledJob) => {
      stopped = true;
      setState({ key: thisKey, job, stillWorking: false });
    };

    const tick = async () => {
      if (stopped) return;
      const elapsed = Date.now() - startedAt;

      if (elapsed >= GIVE_UP_MS) {
        setState((prev) => ({
          key: thisKey,
          job: {
            ...(prev.key === thisKey && prev.job
              ? prev.job
              : { styleId: "", colorId: "", beforeUrl: "" }),
            jobId,
            status: "TIMEOUT",
          },
          stillWorking: false,
        }));
        stopped = true;
        return;
      }

      if (document.visibilityState === "visible") {
        const result = await getTryOnJob(jobId, ownerToken);
        if (stopped) return;
        const job = result.data;
        if (job?.status === "DONE" || job?.status === "FAILED") {
          finish(job);
          return;
        }
        setState({
          key: thisKey,
          job: job ?? null,
          stillWorking: Date.now() - startedAt >= STILL_WORKING_MS,
        });
      }

      timer = setTimeout(tick, POLL_MS);
    };

    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [jobId, ownerToken, attempt]);

  // A new job starts from a clean slate without an extra render.
  return state.key === key
    ? { job: state.job, stillWorking: state.stillWorking }
    : { job: null, stillWorking: false };
}
