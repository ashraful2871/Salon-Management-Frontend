"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Banknote, Download, Play } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/Shared/PageHeader";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import Pagination from "@/components/Shared/Pagination";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { BulkActionBar } from "@/components/Admin/BulkActionBar";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { ExportButton } from "@/components/Admin/finance/ExportButton";
import { MarkPaidSheet } from "@/components/Admin/finance/MarkPaidSheet";
import { RangeChips } from "@/components/Admin/finance/RangeChips";
import { RunPayoutBatchDialog } from "@/components/Admin/finance/RunPayoutBatchDialog";
import { destinationLabel } from "@/components/Admin/finance/payoutDestination";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api-types";
import { approvePayouts } from "@/services/admin/finance/approvePayouts";
import { closePayout } from "@/services/admin/finance/closePayout";
import { markPayoutProcessing } from "@/services/admin/finance/markPayoutProcessing";
import type { AdminPayout, AdminPayouts, PayoutItemResult, PayoutStatus } from "@/services/admin/finance/types";

const TABS: { value: PayoutStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const CANCEL_CODES = [
  { value: "DUPLICATE", label: "Raised twice" },
  { value: "ON_HOLD", label: "Business under review" },
  { value: "WRONG_AMOUNT", label: "Wrong amount" },
  { value: "OTHER", label: "Other" },
];

/** Who a payout goes to: the salon, or the business when it spans branches. */
const payeeName = (row: AdminPayout) => row.salon?.name ?? row.businessName ?? "Business";

const FAILURE_CODES = [
  { value: "WRONG_DETAILS", label: "Wrong account details" },
  { value: "REJECTED_BY_PROVIDER", label: "Rejected by bKash / the bank" },
  { value: "ACCOUNT_CLOSED", label: "Account closed or blocked" },
  { value: "OTHER", label: "Other" },
];

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short" }).format(
    new Date(iso),
  );

const reasonText = (codes: { value: string; label: string }[], reasonCode: string, note?: string) => {
  const label = codes.find((c) => c.value === reasonCode)?.label ?? reasonCode;
  return note ? (reasonCode === "OTHER" ? note : `${label}: ${note}`) : label;
};

/** One toast for an approve: approved, sent to a second admin, refused. */
const reportApprovals = (results: PayoutItemResult[]) => {
  const approved = results.filter((r) => r.ok && r.status === "APPROVED").length;
  const queued = results.filter((r) => r.ok && r.status === "APPROVAL_REQUIRED").length;
  const failed = results.filter((r): r is Extract<PayoutItemResult, { ok: false }> => !r.ok);
  const parts = [
    approved && `${approved} approved`,
    queued && `${queued} sent to a second admin`,
    failed.length && `${failed.length} not approved`,
  ].filter(Boolean);
  const say = failed.length ? toast.error : toast.success;
  say(parts.join(" · ") || "Nothing to approve", { description: failed[0]?.error });
};

/** The bKash / BEFTN transfer file for these payouts, through the export proxy. */
const fileHref = (format: "bkash" | "beftn", status: PayoutStatus, ids: string[]) =>
  `/api/admin/export/payout-files/${format}.csv?${new URLSearchParams({ status, ids: ids.join(",") })}`;

export function PayoutsClient({
  response,
  status,
  page,
  includeTest,
  canManage,
  canExport,
  canExportFiles,
}: {
  response: ApiResponse<AdminPayouts>;
  status: PayoutStatus;
  page: number;
  includeTest: boolean;
  canManage: boolean;
  canExport: boolean;
  /** finance.export + finance.payout_accounts: the transfer files carry full account numbers. */
  canExportFiles: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [batchOpen, setBatchOpen] = useState(false);
  const [paying, setPaying] = useState<AdminPayout[] | null>(null);
  const [failing, setFailing] = useState<AdminPayout | null>(null);
  const [cancelling, setCancelling] = useState<AdminPayout | null>(null);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const href = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const go = (target: string) => {
    setSelected([]);
    navigate(target);
  };

  const data = response.success ? response.data : undefined;
  const items = data?.items ?? [];
  const meta = response.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  // Only rows on this page count: a selected payout that moved on drops out.
  const chosen = items.filter((row) => selected.includes(row.id));
  const ids = chosen.map((row) => row.id);
  const open = status === "PENDING" || status === "APPROVED" || status === "PROCESSING";
  const exportable = status === "APPROVED" || status === "PROCESSING";
  const busy = (id: string) => busyIds.includes(id);

  const approve = (rows: AdminPayout[]) =>
    startTransition(async () => {
      const rowIds = rows.map((r) => r.id);
      setBusyIds(rowIds);
      const result = await run(() => approvePayouts(rowIds));
      setBusyIds([]);
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }
      reportApprovals(result.data);
    });

  const processing = (rows: AdminPayout[]) =>
    startTransition(async () => {
      let done = 0;
      let firstError: string | undefined;
      for (const row of rows) {
        setBusyIds([row.id]);
        const result = await markPayoutProcessing(row.id);
        if (result.success) done += 1;
        else firstError ??= result.message;
      }
      setBusyIds([]);
      if (done) toast.success(`${done} payout(s) marked processing`);
      if (firstError) toast.error(`${rows.length - done} not moved`, { description: firstError });
    });

  const columns: Column<AdminPayout>[] = [
    {
      key: "salon",
      header: "Payee",
      mobile: "primary",
      cell: (row) => (
        <div className="min-w-0">
          <span className="font-medium">{payeeName(row)}</span>
          <span className="block text-xs text-muted-foreground">
            {row.salon ? [row.businessName, row.salon.area].filter(Boolean).join(" · ") : "All branches"}
          </span>
        </div>
      ),
    },
    {
      key: "destination",
      header: "Destination",
      cell: (row) => {
        const label = destinationLabel(row.destinationSnapshot);
        return label ? (
          <div className="text-sm">
            <span className="tabular-nums" title="Masked">
              {label}
            </span>
            <span className="block text-xs text-muted-foreground">{row.destinationSnapshot?.accountName}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "period",
      header: "Period",
      cell: (row) => `${shortDate(row.periodStart)} – ${shortDate(row.periodEnd)}`,
    },
    {
      key: "net",
      header: "Net",
      align: "right",
      mobile: "meta",
      cell: (row) => <span className="font-semibold tabular-nums">{formatBDT(row.netMinor)}</span>,
    },
    {
      key: "detail",
      header:
        status === "FAILED" || status === "CANCELLED"
          ? "Reason"
          : status === "PAID"
            ? "Reference"
            : status === "APPROVED"
              ? "Approved"
              : "Raised",
      cell: (row) =>
        status === "FAILED" ? (
          <span className="text-sm text-danger">{row.failureReason ?? "—"}</span>
        ) : status === "CANCELLED" ? (
          <span className="text-sm text-muted-foreground">{row.cancelledReason ?? "—"}</span>
        ) : status === "APPROVED" ? (
          <span className="text-sm text-muted-foreground">{row.approvedAt ? formatDhaka(row.approvedAt) : "—"}</span>
        ) : status === "PAID" ? (
          <div className="text-sm">
            <span className="font-mono">{row.reference}</span>
            <span className="block text-xs text-muted-foreground">
              {row.method === "BKASH" ? "bKash" : "Bank"}
              {row.paidAt ? ` · ${formatDhaka(row.paidAt)}` : ""}
              {row.markedPaidBy?.name ? ` · ${row.markedPaidBy.name}` : ""}
            </span>
            {row.proofUrl && (
              <a href={row.proofUrl} target="_blank" rel="noreferrer noopener" className="text-xs text-primary hover:underline">
                Proof
              </a>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{formatDhaka(row.createdAt)}</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "trailing",
      cell: (row) => <ToneBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Raised every week: approve, send the bKash or bank file, then paste the references."
        actions={
          <div className="flex flex-wrap gap-2">
            {canExport && <ExportButton kind="payouts" includeTest={includeTest} />}
            {canManage && (
              <Button size="sm" onClick={() => setBatchOpen(true)}>
                <Play className="size-4" aria-hidden />
                Run payout batch
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Payout status" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          {TABS.map((tab) => {
            const count = data?.statusCounts[tab.value]?.count;
            const active = tab.value === status;
            return (
              <Link
                key={tab.value}
                href={href({ status: tab.value, page: null })}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(href({ status: tab.value, page: null }));
                }}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-muted",
                )}
              >
                {tab.label}
                {count !== undefined && <span className="ml-1.5 tabular-nums opacity-80">{count}</span>}
              </Link>
            );
          })}
        </nav>
        <RangeChips range="all" includeTest={includeTest} showRange={false} />
      </div>

      {!response.success ? (
        <ErrorState message={response.message} />
      ) : (
        <div className={cn(isPending && "opacity-70")} aria-busy={isPending}>
          <DataList
            items={items}
            rowKey={(row) => row.id}
            columns={columns}
            caption={`${status.toLowerCase()} payouts`}
            selectable={open && (canManage || (exportable && canExportFiles))}
            selected={selected}
            onSelectedChange={setSelected}
            empty={
              <EmptyState
                icon={Banknote}
                title={`No ${status.toLowerCase()} payouts`}
                description={status === "PENDING" ? "They are raised on payout day at 09:00, or run the batch by hand." : undefined}
              />
            }
            rowActions={
              // PAID, FAILED and CANCELLED are terminal (the last two already put
              // their money back in the business's balance). The moves offered
              // mirror the backend's PAYOUT_TRANSITIONS.
              canManage && open
                ? (row) => (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {row.status === "PENDING" && (
                        <Button variant="ghost" size="sm" disabled={busy(row.id)} onClick={() => approve([row])}>
                          Approve
                        </Button>
                      )}
                      {row.status !== "PROCESSING" && (
                        <Button variant="ghost" size="sm" disabled={busy(row.id)} onClick={() => processing([row])}>
                          Processing
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" disabled={busy(row.id)} onClick={() => setPaying([row])}>
                        Mark paid
                      </Button>
                      {row.status === "PROCESSING" ? (
                        <Button variant="ghost" size="sm" disabled={busy(row.id)} onClick={() => setFailing(row)}>
                          Failed
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled={busy(row.id)} onClick={() => setCancelling(row)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  )
                : undefined
            }
          />
          <BulkActionBar count={chosen.length} onClear={() => setSelected([])} noun="payouts selected">
            {canManage && status === "PENDING" && (
              <Button size="sm" disabled={busyIds.length > 0} onClick={() => approve(chosen)}>
                Approve selected
              </Button>
            )}
            {exportable && canExportFiles && (
              <>
                <a href={fileHref("bkash", status, ids)} download className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  <Download className="size-4" aria-hidden />
                  bKash file
                </a>
                <a href={fileHref("beftn", status, ids)} download className={buttonVariants({ variant: "secondary", size: "sm" })}>
                  <Download className="size-4" aria-hidden />
                  BEFTN file
                </a>
              </>
            )}
            {canManage && status !== "PROCESSING" && (
              <Button size="sm" variant="secondary" disabled={busyIds.length > 0} onClick={() => processing(chosen)}>
                Mark processing
              </Button>
            )}
            {canManage && exportable && (
              <Button size="sm" disabled={busyIds.length > 0} onClick={() => setPaying(chosen)}>
                Mark paid
              </Button>
            )}
          </BulkActionBar>
          {meta && (
            <Pagination
              className="mt-4"
              page={page}
              totalPages={totalPages}
              total={meta.total}
              pageSize={meta.limit}
              itemLabel="payouts"
              disabled={isPending}
              onPageChange={(next) => go(href({ page: String(next) }))}
            />
          )}
        </div>
      )}

      {batchOpen && <RunPayoutBatchDialog open onOpenChange={setBatchOpen} />}
      {paying && (
        <MarkPaidSheet
          payouts={paying}
          open
          onOpenChange={(next) => !next && setPaying(null)}
          onDone={(paidIds) => setSelected((current) => current.filter((id) => !paidIds.includes(id)))}
        />
      )}
      <ReasonDialog
        open={!!failing}
        onOpenChange={(next) => !next && setFailing(null)}
        title="Mark payout failed"
        description={
          failing
            ? `${formatBDT(failing.netMinor)} to ${payeeName(failing)}. The money goes back to the balance and the owner gets an email.`
            : undefined
        }
        reasonCodes={FAILURE_CODES}
        confirmLabel="Mark failed"
        tone="danger"
        showNotify={false}
        stepUp
        onConfirm={({ reasonCode, note }) => closePayout(failing!.id, "fail", reasonText(FAILURE_CODES, reasonCode, note))}
        onDone={() => toast.success("Payout marked failed")}
      />
      <ReasonDialog
        open={!!cancelling}
        onOpenChange={(next) => !next && setCancelling(null)}
        title="Cancel payout"
        description={
          cancelling
            ? `${formatBDT(cancelling.netMinor)} to ${payeeName(cancelling)}. The money goes back to the business's balance for the next run.`
            : undefined
        }
        reasonCodes={CANCEL_CODES}
        confirmLabel="Cancel payout"
        tone="danger"
        showNotify={false}
        stepUp
        onConfirm={({ reasonCode, note }) =>
          closePayout(cancelling!.id, "cancel", reasonText(CANCEL_CODES, reasonCode, note))
        }
        onDone={() => toast.success("Payout cancelled")}
      />
      {dialog}
    </div>
  );
}
