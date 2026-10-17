"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/Shared/PageHeader";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatBDT, toMinor } from "@/lib/money";
import { cn } from "@/lib/utils";
import { TONE_CLASSES } from "@/lib/status-tone";
import { adjustOwnerDues, type OwnerDuesRow } from "@/services/admin/finance/dues";
import { isApprovalRequired } from "@/services/admin/finance/types";

const day = (iso: string) => format(new Date(iso), "d MMM yyyy");

const Pill = ({ tone, children }: { tone: "danger" | "warning"; children: React.ReactNode }) => (
  <span
    className={cn(
      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
      TONE_CLASSES[tone].soft,
      TONE_CLASSES[tone].text,
    )}
  >
    {children}
  </span>
);

const status = (r: OwnerDuesRow) =>
  r.paused ? (
    <Pill tone="danger">Paused{r.pausedAt ? ` · ${day(r.pausedAt)}` : ""}</Pill>
  ) : r.warnedAt ? (
    <Pill tone="warning">Warned {day(r.warnedAt)}</Pill>
  ) : (
    <span className="text-muted-foreground">-</span>
  );

const COLUMNS: Column<OwnerDuesRow>[] = [
  {
    key: "owner",
    header: "Owner",
    mobile: "primary",
    cell: (r) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{r.ownerName}</p>
        <p className="truncate text-xs text-muted-foreground">{r.email}</p>
      </div>
    ),
  },
  { key: "business", header: "Business", cell: (r) => r.businessName ?? "-" },
  {
    key: "dues",
    header: "Dues",
    align: "right",
    cell: (r) => <span className="font-semibold tabular-nums">{formatBDT(r.duesMinor)}</span>,
    mobileCell: (r) => `Owes ${formatBDT(r.duesMinor)}`,
  },
  {
    key: "age",
    header: "Age",
    align: "right",
    cell: (r) => (r.ageDays === null ? "-" : `${r.ageDays} d`),
    mobileCell: (r) => (r.ageDays === null ? null : `${r.ageDays} days`),
  },
  { key: "paused", header: "Bookings", cell: status, mobileCell: status },
];

/**
 * Finance › Owner dues: who owes, for how long, and whether online bookings
 * are paused. A waiver (tier 3, four-eyes over the threshold) credits the
 * most negative branch from platform revenue.
 */
export function DuesClient({
  rows,
  error,
  includeTest,
  canAdjust,
}: {
  rows: OwnerDuesRow[];
  error: string | null;
  includeTest: boolean;
  canAdjust: boolean;
}) {
  const [target, setTarget] = useState<OwnerDuesRow | null>(null);
  const total = rows.reduce((t, r) => t + r.duesMinor, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Owner dues"
        description={`${rows.length} ${rows.length === 1 ? "business owes" : "businesses owe"} ${formatBDT(total)} in all`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={includeTest ? "?" : "?includeTest=true"}>
              {includeTest ? "Hide test data" : "Include test data"}
            </Link>
          </Button>
        }
      />
      {error ? (
        <ErrorState message={error} />
      ) : (
        <DataList
          items={rows}
          rowKey={(r) => r.ownerId}
          columns={COLUMNS}
          caption="Owner dues"
          rowActions={(r) =>
            canAdjust && r.duesMinor > 0 ? (
              <Button size="sm" variant="outline" onClick={() => setTarget(r)}>
                Waive
              </Button>
            ) : null
          }
          empty={<EmptyState title="No dues" description="Every business is square with the platform." />}
        />
      )}
      {target && <WaiveDialog row={target} onClose={() => setTarget(null)} />}
    </div>
  );
}

const AMOUNT = /^\d+(\.\d{1,2})?$/;

function WaiveDialog({ row, onClose }: { row: OwnerDuesRow; onClose: () => void }) {
  const ids = useId();
  const [amount, setAmount] = useState(String(row.duesMinor / 100));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const valid = AMOUNT.test(amount.trim()) && Number(amount) > 0;
  const minor = valid ? toMinor(Number(amount)) : 0;
  const tooMuch = minor > row.duesMinor;
  const ready = valid && !tooMuch && reason.trim().length >= 3;

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await run(() =>
        adjustOwnerDues(row.ownerId, { amountMinor: minor, reason: reason.trim() }),
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (isApprovalRequired(result.data)) {
        toast.success("Sent for approval", {
          description: "Another admin has to approve this waiver before it is applied.",
        });
      } else {
        toast.success(`Waived ${formatBDT(minor)}`);
      }
      onClose();
    });

  return (
    <>
      <ResponsiveDialog
        open
        onOpenChange={(next) => !pending && !next && onClose()}
        title="Waive dues"
        description={`${row.businessName ?? row.ownerName} · owes ${formatBDT(row.duesMinor)}`}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!ready || pending}>
              {pending ? "Saving…" : valid ? `Waive ${formatBDT(minor)}` : "Waive"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-amount`}>Amount in taka</Label>
            <Input
              id={`${ids}-amount`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={amount !== "" && (!valid || tooMuch)}
            />
            {amount !== "" && !valid && (
              <p className="text-xs text-danger">Enter a positive amount with at most two decimals.</p>
            )}
            {tooMuch && (
              <p className="text-xs text-danger">
                Can&apos;t waive more than the {formatBDT(row.duesMinor)} owed.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-reason`}>Reason *</Label>
            <Textarea
              id={`${ids}-reason`}
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why the platform absorbs this, and any ticket"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Credits the most negative branch from platform revenue. Online bookings resume when the
            dues reach zero.
          </p>
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
