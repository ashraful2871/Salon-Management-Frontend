"use client";

import { useEffect } from "react";
import { Download, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SafeImage from "@/components/Shared/SafeImage";
import { cn } from "@/lib/utils";
import type { HairCatalog } from "@/services/hairstyle/types";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { useTryOnJob } from "./useTryOnJob";
import type { CurrentJob, DoneJob } from "./TryOnPanel";

export function ResultStep({
  catalog,
  ownerToken,
  current,
  done,
  viewing,
  onDone,
  onView,
  onRetry,
  onCancel,
  onTryAnother,
  onDelete,
  onStartOver,
  retrying,
  deleting,
}: {
  catalog: HairCatalog;
  ownerToken: string;
  current: CurrentJob | null;
  done: Record<string, DoneJob>;
  viewing: string | null;
  onDone: (job: DoneJob) => void;
  onView: (key: string) => void;
  onRetry: () => void;
  onCancel: () => void;
  onTryAnother: () => void;
  onDelete: () => void;
  onStartOver: () => void;
  retrying: boolean;
  deleting: boolean;
}) {
  const shown = viewing ? done[viewing] : undefined;
  const { job, stillWorking } = useTryOnJob(
    shown ? null : (current?.jobId ?? null),
    ownerToken,
    current?.attempt,
  );

  useEffect(() => {
    if (job?.status === "DONE" && job.resultUrl && current) {
      onDone({
        styleId: current.styleId,
        colorId: current.colorId,
        beforeUrl: job.beforeUrl,
        resultUrl: job.resultUrl,
        downloadUrl: job.downloadUrl,
      });
    }
  }, [job, current, onDone]);

  const styleName = (id: string) => catalog.styles.find((s) => s.id === id)?.name ?? "the new style";
  const colorName = (id: string) => catalog.colors.find((c) => c.id === id)?.name;
  const label = (j: { styleId: string; colorId: string }) =>
    [styleName(j.styleId), j.colorId !== "natural" ? colorName(j.colorId) : null]
      .filter(Boolean)
      .join(" · ");

  const history = Object.entries(done);
  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={onTryAnother}>
        Try another style
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={deleting}
        onClick={onDelete}
        className="text-danger hover:bg-danger-soft hover:text-danger"
      >
        {deleting ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
        Delete my photo
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onStartOver}>
        Start over
      </Button>
    </div>
  );

  if (shown) {
    return (
      <div className="space-y-4">
        <BeforeAfterSlider
          beforeUrl={shown.beforeUrl}
          afterUrl={shown.resultUrl}
          styleName={styleName(shown.styleId)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{label(shown)}</p>
            <p className="text-xs text-muted-foreground">AI preview, just for fun</p>
          </div>
          {shown.downloadUrl && (
            <a
              href={shown.downloadUrl}
              download
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Download aria-hidden /> Download
            </a>
          )}
        </div>

        {history.length > 1 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Your try-ons</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map(([key, j]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={key === viewing}
                  aria-label={label(j)}
                  title={label(j)}
                  onClick={() => onView(key)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-muted",
                    key === viewing ? "border-primary" : "border-transparent",
                  )}
                >
                  <SafeImage src={j.resultUrl} alt="" fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {actions}
      </div>
    );
  }

  if (job?.status === "FAILED" || job?.status === "TIMEOUT") {
    const blocked = job.status === "FAILED" && job.errorCode === "SAFETY_BLOCKED";
    return (
      <div className="space-y-4">
        <p
          aria-live="polite"
          className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {blocked
            ? "We couldn't edit this photo, try another one."
            : "Something went wrong, try again."}
        </p>
        {!blocked && (
          <Button type="button" disabled={retrying} onClick={onRetry}>
            {retrying ? <Loader2 className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
            Try again
          </Button>
        )}
        {actions}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Skeleton className="mx-auto aspect-[4/5] w-full max-w-[calc(55dvh*0.8)] rounded-2xl" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {stillWorking ? "Still working…" : "This takes about 10–20 seconds"}
        </p>
        {stillWorking && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
