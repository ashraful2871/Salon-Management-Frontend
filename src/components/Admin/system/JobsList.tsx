"use client";

import { useState, useTransition } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataList, type Column } from "@/components/Shared/DataList";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { formatDhaka } from "@/components/Admin/Timeline";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { runSystemJob } from "@/services/admin/system/runSystemJob";
import type { SystemJob } from "@/services/admin/system/types";
import { formatDuration, relativeTime, RUN_TONE } from "./format";

/**
 * Every background job with its last run. "Run now" (step-up) is offered
 * only for jobs the backend marks safeToRunNow, and only with system.operate.
 */
export function JobsList({
  jobs,
  nowMs,
  canOperate,
}: {
  jobs: SystemJob[];
  nowMs: number;
  canOperate: boolean;
}) {
  const { run, dialog } = useStepUp();
  const [pendingJob, setPendingJob] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const runNow = (name: string) => {
    setPendingJob(name);
    startTransition(async () => {
      const result = await run(() => runSystemJob(name));
      setPendingJob(null);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      const status = result.data?.status;
      if (status === "FAILED") toast.error(`${name}: ${result.data?.error ?? result.message}`);
      else if (status === "SKIPPED") toast.info(`${name} is already running, so this run was skipped`);
      else toast.success(`${name}: ${result.message}`);
    });
  };

  const columns: Column<SystemJob>[] = [
    {
      key: "job",
      header: "Job",
      mobile: "primary",
      cell: (job) => (
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium">{job.name}</p>
          <p className="text-xs text-muted-foreground">Every {job.every}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (job) =>
        job.lastRun ? (
          <ToneBadge status={job.lastRun.status} tone={RUN_TONE[job.lastRun.status]} dot />
        ) : (
          <ToneBadge status="NEVER" tone="neutral">
            Never run
          </ToneBadge>
        ),
    },
    {
      key: "last",
      header: "Last run",
      cell: (job) =>
        job.lastRun ? (
          <time dateTime={job.lastRun.startedAt} title={formatDhaka(job.lastRun.startedAt)}>
            {relativeTime(job.lastRun.startedAt, nowMs)}
            {job.lastRun.trigger !== "timer" && (
              <span className="text-muted-foreground"> · {job.lastRun.trigger}</span>
            )}
          </time>
        ) : (
          "—"
        ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      cell: (job) => <span className="tabular-nums">{formatDuration(job.lastRun?.durationMs)}</span>,
    },
    {
      key: "failures",
      header: "Failed 24 h",
      align: "right",
      cell: (job) => (
        <span className={job.failures24h > 0 ? "font-semibold tabular-nums text-danger" : "tabular-nums text-muted-foreground"}>
          {job.failures24h}
        </span>
      ),
    },
    {
      key: "next",
      header: "Next run",
      className: "hidden @4xl:table-cell",
      cell: (job) =>
        job.nextRunApprox ? (
          <span title="This server's timer; approximate">≈ {relativeTime(job.nextRunApprox, nowMs)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "error",
      header: "Error",
      mobile: "secondary",
      cell: (job) =>
        job.lastRun?.error ? (
          <details className="max-w-xs text-sm">
            <summary className="cursor-pointer text-danger">
              {job.lastRun.error.length > 48 ? `${job.lastRun.error.slice(0, 48)}…` : job.lastRun.error}
            </summary>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-muted p-2 text-xs">
              {job.lastRun.error}
            </pre>
          </details>
        ) : null,
    },
  ];

  return (
    <>
      <DataList
        items={jobs}
        rowKey={(job) => job.name}
        columns={columns}
        caption="Background jobs"
        density="compact"
        tableFrom="3xl"
        empty={<p className="p-4 text-sm text-muted-foreground">No jobs are registered.</p>}
        rowClassName={(job) => (job.lastRun?.status === "FAILED" ? "bg-danger-soft/40" : "")}
        rowActions={(job) =>
          canOperate && job.safeToRunNow ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => runNow(job.name)}
              disabled={pendingJob === job.name}
              aria-label={`Run ${job.name} now`}
            >
              <Play className="size-3.5" aria-hidden />
              {pendingJob === job.name ? "Running…" : "Run now"}
            </Button>
          ) : null
        }
      />
      {dialog}
    </>
  );
}
