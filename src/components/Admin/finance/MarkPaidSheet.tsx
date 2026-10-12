"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { markPayoutsPaid } from "@/services/admin/finance/markPayoutsPaid";
import type { AdminPayout, PayoutItemResult } from "@/services/admin/finance/types";
import { destinationLabel, methodFor, payoutNote } from "./payoutDestination";

type Row = { method: "BKASH" | "BANK"; reference: string; proofUrl: string };

const payee = (p: AdminPayout) => p.salon?.name ?? p.businessName ?? "Business";

/**
 * Reads pasted `payout_id,reference` lines (a header line is skipped). The id
 * may be the full id, its first 8 characters, or the SK-PO- note from the
 * transfer file. Returns the matches and how many lines matched nothing.
 */
const parsePasted = (text: string, payouts: AdminPayout[]) => {
  const found = new Map<string, string>();
  let unmatched = 0;
  for (const line of text.split(/\r?\n/)) {
    const [rawId, ...rest] = line.split(",");
    const id = rawId?.trim().replace(/^"|"$/g, "") ?? "";
    const reference = rest.join(",").trim().replace(/^"|"$/g, "");
    if (!id || !reference || /^payout_id$/i.test(id)) continue;
    const key = id.replace(/^SK-PO-/i, "").toLowerCase();
    const match = payouts.find((p) => p.id.toLowerCase() === key || p.id.slice(0, 8).toLowerCase() === key);
    if (match) found.set(match.id, reference);
    else unmatched += 1;
  }
  return { found, unmatched };
};

/**
 * Mark paid in bulk: one row per selected payout with its own reference,
 * method and optional proof link, or paste `payout_id,reference` from the
 * bank/bKash result. Each row is its own move on the API; the answer comes
 * back as a chip per row, and the paid ones leave the list.
 */
export function MarkPaidSheet({
  payouts,
  open,
  onOpenChange,
  onDone,
}: {
  payouts: AdminPayout[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The ids that were marked paid, so the page can drop them from the selection. */
  onDone: (paidIds: string[]) => void;
}) {
  const ids = useId();
  // Mounted per opening (the page renders it only while open), so the form
  // starts from the selection it was opened with.
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(payouts.map((p) => [p.id, { method: methodFor(p), reference: "", proofUrl: "" }])),
  );
  const [pasted, setPasted] = useState("");
  const [results, setResults] = useState<Record<string, PayoutItemResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const set = (id: string, patch: Partial<Row>) =>
    setRows((current) => ({ ...current, [id]: { ...current[id], ...patch } }));

  const applyPaste = () => {
    const { found, unmatched } = parsePasted(pasted, payouts);
    setRows((current) => {
      const next = { ...current };
      for (const [id, reference] of found) next[id] = { ...next[id], reference };
      return next;
    });
    toast.message(`${found.size} reference(s) filled`, {
      description: unmatched ? `${unmatched} line(s) matched no selected payout.` : undefined,
    });
  };

  const todo = payouts.filter((p) => rows[p.id]?.reference.trim() && !results[p.id]?.ok);

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const response = await run(() =>
        markPayoutsPaid(
          todo.map((p) => ({
            payoutId: p.id,
            reference: rows[p.id].reference.trim(),
            method: rows[p.id].method,
            proofUrl: rows[p.id].proofUrl.trim() || undefined,
          })),
        ),
      );
      if (!response.success || !response.data) {
        setError(response.message);
        return;
      }
      const byId = Object.fromEntries(response.data.map((r) => [r.payoutId, r]));
      setResults((current) => ({ ...current, ...byId }));
      const paid = response.data.filter((r) => r.ok).map((r) => r.payoutId);
      const failed = response.data.length - paid.length;
      if (paid.length) {
        toast.success(`${paid.length} payout(s) marked paid`, { description: "Each owner gets an email." });
        onDone(paid);
      }
      if (failed) toast.error(`${failed} payout(s) were not marked paid`, { description: "See the row for why." });
    });

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => !pending && onOpenChange(next)}
        title="Mark paid"
        description={`${payouts.length} payout(s), ${formatBDT(payouts.reduce((s, p) => s + p.netMinor, 0))}. A reference is required for each one you mark.`}
        className="sm:max-w-3xl"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
              Close
            </Button>
            <Button onClick={submit} disabled={pending || todo.length === 0}>
              {pending ? "Saving…" : `Mark ${todo.length} paid`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <details className="rounded-xl border border-border bg-surface-subtle px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">Paste references (CSV)</summary>
            <div className="mt-2 space-y-2">
              <Label htmlFor={`${ids}-paste`} className="text-xs text-muted-foreground">
                One <code>payout_id,reference</code> per line. The id can be the full id, its first 8 characters or the SK-PO- note.
              </Label>
              <Textarea
                id={`${ids}-paste`}
                rows={4}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                className="font-mono text-xs"
                placeholder={"payout_id,reference\nSK-PO-1A2B3C4D,9GH7K2LM"}
              />
              <Button size="sm" variant="secondary" onClick={applyPaste} disabled={!pasted.trim()}>
                Fill references
              </Button>
            </div>
          </details>

          <ul className="divide-y divide-border rounded-xl border border-border">
            {payouts.map((p) => {
              const row = rows[p.id];
              const result = results[p.id];
              if (!row) return null;
              const done = result?.ok;
              return (
                <li key={p.id} className="space-y-2 px-3 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-medium">{payee(p)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {payoutNote(p.id)} · {destinationLabel(p.destinationSnapshot) ?? "No account on record"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums">{formatBDT(p.netMinor)}</span>
                      {result && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            result.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                          )}
                        >
                          {result.ok ? "Paid" : result.error}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[8rem_1fr_1fr]">
                    <select
                      aria-label={`Method for ${payee(p)}`}
                      value={row.method}
                      disabled={done || pending}
                      onChange={(e) => set(p.id, { method: e.target.value as Row["method"] })}
                      className="h-9 rounded-md border border-input bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="BKASH">bKash</option>
                      <option value="BANK">Bank</option>
                    </select>
                    <Input
                      aria-label={`Reference for ${payee(p)}`}
                      value={row.reference}
                      maxLength={120}
                      disabled={done || pending}
                      onChange={(e) => set(p.id, { reference: e.target.value })}
                      placeholder="TrxID or bank reference"
                    />
                    <Input
                      aria-label={`Proof link for ${payee(p)}`}
                      type="url"
                      value={row.proofUrl}
                      maxLength={500}
                      disabled={done || pending}
                      onChange={(e) => set(p.id, { proofUrl: e.target.value })}
                      placeholder="Proof link (optional)"
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {error && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </ResponsiveDialog>
      {dialog}
    </>
  );
}
