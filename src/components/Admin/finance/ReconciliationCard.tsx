"use client";

import Link from "next/link";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { formatDhaka } from "@/components/Admin/Timeline";
import { runReconciliation } from "@/services/admin/finance/runReconciliation";
import type { ReconciliationCounts } from "@/services/admin/finance/types";

/**
 * Are the books straight? Each count should be zero. "Run reconciliation
 * now" settles stuck gateway intents (the hourly job's work) on demand.
 */
export function ReconciliationCard({
  counts,
  canRun,
}: {
  counts: ReconciliationCounts;
  canRun: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const rows = [
    {
      label: "Unbalanced bookings",
      value: counts.unbalancedCount,
      href: "/dashboard/admin/finance/ledger#unbalanced",
    },
    {
      label: "Wallets out of step",
      value: counts.driftCount,
      href: "/dashboard/admin/finance/ledger#drift",
    },
    {
      label: "Top-ups stuck over 1 h",
      value: counts.stuckIntents,
      href: "/dashboard/admin/finance/topups?status=PENDING",
    },
  ];
  const clean = rows.every((row) => row.value === 0);

  const run = () =>
    startTransition(async () => {
      const result = await runReconciliation();
      if (result.success) toast.success("Reconciliation complete");
      else toast.error(result.message);
    });

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Reconciliation</h2>
          <p className="text-sm text-muted-foreground">
            Last run{" "}
            {counts.lastReconcileAt ? formatDhaka(counts.lastReconcileAt) : "not since the last deploy"}
          </p>
        </div>
        <ToneBadge status={clean ? "PAID" : "FAILED"} tone={clean ? "success" : "danger"} dot>
          {clean ? "Books balance" : "Needs a look"}
        </ToneBadge>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 py-2 text-sm">
            <Link href={row.href} className="hover:underline">
              {row.label}
            </Link>
            <span
              className={
                row.value > 0 ? "font-semibold tabular-nums text-danger" : "tabular-nums text-muted-foreground"
              }
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      {canRun && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={run} disabled={pending}>
          <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} aria-hidden />
          {pending ? "Running…" : "Run reconciliation now"}
        </Button>
      )}
    </section>
  );
}
