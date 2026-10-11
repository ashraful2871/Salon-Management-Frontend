"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatBDT } from "@/lib/money";
import { previewPayoutBatch } from "@/services/admin/finance/previewPayoutBatch";
import { runPayoutBatch } from "@/services/admin/finance/runPayoutBatch";
import type { PayoutPreview } from "@/services/admin/finance/types";

/**
 * "Run payout batch": preview what each salon would get (no writes), then
 * confirm with a reason and step-up. The run uses the preview's period end,
 * so the totals match unless new ledger entries land in between.
 */
export function RunPayoutBatchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [preview, setPreview] = useState<PayoutPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, startLoading] = useTransition();
  const [running, startRunning] = useTransition();
  const { run, dialog } = useStepUp();

  // Mounted only while open, so each opening starts fresh.
  useEffect(() => {
    startLoading(async () => {
      const result = await previewPayoutBatch();
      if (result.success && result.data) setPreview(result.data);
      else setError(result.message);
    });
  }, []);

  const confirm = () =>
    startRunning(async () => {
      if (!preview) return;
      const result = await run(() => runPayoutBatch(preview.periodEnd, reason.trim()));
      if (!result.success || !result.data) {
        setError(result.message);
        return;
      }
      const total = result.data.created.reduce((sum, row) => sum + row.netMinor, 0);
      toast.success(`${result.data.created.length} payout(s) raised`, {
        description:
          total === preview.totals.netMinor
            ? `${formatBDT(total)}, as previewed.`
            : `${formatBDT(total)} - the preview said ${formatBDT(preview.totals.netMinor)}; entries changed in between.`,
      });
      onOpenChange(false);
    });

  const empty = preview && preview.rows.length === 0;

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => !running && onOpenChange(next)}
        title="Run payout batch"
        description="Each business's available balance (past the hold, all branches netted) becomes one pending payout. Nothing is sent until you mark it paid."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={running}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={!preview || !!empty || running || loading}>
              {running ? "Raising payouts…" : preview ? `Raise ${preview.totals.salons} payout(s)` : "Raise payouts"}
            </Button>
          </div>
        }
      >
        {loading && <p className="text-sm text-muted-foreground">Building the preview…</p>}
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {empty && <p className="text-sm text-muted-foreground">No business is owed a payout right now.</p>}
        {preview && !empty && (
          <div className="space-y-4">
            <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-subtle text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Salon</th>
                    <th className="px-3 py-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.rows.map((row) => (
                    <tr key={row.ownerId}>
                      <td className="px-3 py-2">
                        <span className="font-medium">{row.businessName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {row.salons > 1 ? row.salonName : [row.salonName, row.area].filter(Boolean).join(" · ")}
                          {row.isTest ? " · test" : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatBDT(row.netMinor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-border bg-surface-subtle font-semibold">
                  <tr>
                    <td className="px-3 py-2">{preview.totals.salons} business(es)</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatBDT(preview.totals.netMinor)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {preview.skipped.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Carried to the next run: {preview.skipped.filter((s) => s.reason === "below minimum").length} below
                the {formatBDT(preview.minMinor)} minimum, {preview.skipped.filter((s) => s.reason === "dues").length} owing
                dues. Earnings younger than {preview.holdDays} day(s) are still on hold.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="batch-reason">Note for the audit log (optional)</Label>
              <Textarea
                id="batch-reason"
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Weekly payout, week 41"
              />
            </div>
          </div>
        )}
      </ResponsiveDialog>
      {dialog}
    </>
  );
}
