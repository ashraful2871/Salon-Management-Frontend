"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { backfillAiIndex } from "@/services/admin/system/backfillAiIndex";
import type { AiIndexStatus } from "@/services/admin/system/types";

/** AI search index coverage; below 95% is what fires the ai.coverage alert. */
export function AiIndexCard({ status, canOperate }: { status: AiIndexStatus; canOperate: boolean }) {
  const [pending, startTransition] = useTransition();
  const coverage = status.activeSalons > 0 ? (status.upToDate / status.activeSalons) * 100 : 100;
  const rounded = Math.round(coverage * 10) / 10;

  const backfill = () =>
    startTransition(async () => {
      const result = await backfillAiIndex();
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-2xl font-semibold tabular-nums">{rounded}%</p>
          <p className="text-sm text-muted-foreground">
            {status.upToDate} of {status.activeSalons} active salons indexed and up to date
          </p>
        </div>
        <ToneBadge
          status={coverage >= 95 ? "OK" : "LOW"}
          tone={!status.geminiConfigured ? "danger" : coverage >= 95 ? "success" : "warning"}
          dot
        >
          {!status.geminiConfigured ? "Gemini not configured" : coverage >= 95 ? "Healthy" : "Below 95%"}
        </ToneBadge>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Stale</dt>
          <dd className="tabular-nums">{status.stale}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Missing</dt>
          <dd className="tabular-nums">{status.missing}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Model</dt>
          <dd className="truncate font-mono text-xs" title={status.model}>
            {status.model}
          </dd>
        </div>
      </dl>
      {canOperate && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={backfill} disabled={pending}>
          <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} aria-hidden />
          {pending ? "Backfilling…" : "Backfill"}
        </Button>
      )}
    </section>
  );
}
