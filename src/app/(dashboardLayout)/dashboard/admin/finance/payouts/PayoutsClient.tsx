"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Banknote, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/Shared/PageHeader";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { ErrorState } from "@/components/Shared/ErrorState";
import Pagination from "@/components/Shared/Pagination";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { formatDhaka } from "@/components/Admin/Timeline";
import { ExportButton } from "@/components/Admin/finance/ExportButton";
import { MarkPaidDialog } from "@/components/Admin/finance/MarkPaidDialog";
import { RangeChips } from "@/components/Admin/finance/RangeChips";
import { RunPayoutBatchDialog } from "@/components/Admin/finance/RunPayoutBatchDialog";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api-types";
import { updatePayout } from "@/services/admin/finance/updatePayout";
import type { AdminPayout, AdminPayouts, PayoutStatus } from "@/services/admin/finance/types";

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

export function PayoutsClient({
  response,
  status,
  page,
  includeTest,
  canManage,
  canExport,
}: {
  response: ApiResponse<AdminPayouts>;
  status: PayoutStatus;
  page: number;
  includeTest: boolean;
  canManage: boolean;
  canExport: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [batchOpen, setBatchOpen] = useState(false);
  const [paying, setPaying] = useState<AdminPayout | null>(null);
  const [failing, setFailing] = useState<AdminPayout | null>(null);
  const [cancelling, setCancelling] = useState<AdminPayout | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
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

  const move = (payout: AdminPayout, to: "APPROVED" | "PROCESSING", done: string) =>
    startTransition(async () => {
      setBusyId(payout.id);
      const result = await run(() => updatePayout(payout.id, { status: to }));
      setBusyId(null);
      if (result.success) toast.success(done);
      else toast.error(result.message);
    });

  const data = response.success ? response.data : undefined;
  const meta = response.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

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
        description="One payout per business: what each is owed, the transfers sent, and the ones that bounced."
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
                  navigate(href({ status: tab.value, page: null }));
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
            items={data?.items ?? []}
            rowKey={(row) => row.id}
            columns={columns}
            caption={`${status.toLowerCase()} payouts`}
            empty={
              <EmptyState
                icon={Banknote}
                title={`No ${status.toLowerCase()} payouts`}
                description={status === "PENDING" ? "Run the payout batch to raise this week's." : undefined}
              />
            }
            rowActions={
              // PAID, FAILED and CANCELLED are terminal (the last two already put
              // their money back in the business's balance). The moves offered
              // mirror the backend's PAYOUT_TRANSITIONS.
              canManage && (status === "PENDING" || status === "APPROVED" || status === "PROCESSING")
                ? (row) => (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {row.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === row.id}
                          onClick={() => move(row, "APPROVED", "Payout approved")}
                        >
                          Approve
                        </Button>
                      )}
                      {row.status !== "PROCESSING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === row.id}
                          onClick={() => move(row, "PROCESSING", "Marked processing")}
                        >
                          Processing
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" disabled={busyId === row.id} onClick={() => setPaying(row)}>
                        Mark paid
                      </Button>
                      {row.status === "PROCESSING" ? (
                        <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => setFailing(row)}>
                          Failed
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => setCancelling(row)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  )
                : undefined
            }
          />
          {meta && (
            <Pagination
              className="mt-4"
              page={page}
              totalPages={totalPages}
              total={meta.total}
              pageSize={meta.limit}
              itemLabel="payouts"
              disabled={isPending}
              onPageChange={(next) => navigate(href({ page: String(next) }))}
            />
          )}
        </div>
      )}

      {batchOpen && <RunPayoutBatchDialog open onOpenChange={setBatchOpen} />}
      <MarkPaidDialog payout={paying} onOpenChange={(open) => !open && setPaying(null)} />
      <ReasonDialog
        open={!!failing}
        onOpenChange={(open) => !open && setFailing(null)}
        title="Mark payout failed"
        description={failing ? `${formatBDT(failing.netMinor)} to ${payeeName(failing)}. The owner gets an email.` : undefined}
        reasonCodes={FAILURE_CODES}
        confirmLabel="Mark failed"
        tone="danger"
        showNotify={false}
        stepUp
        onConfirm={({ reasonCode, note }) => {
          const label = FAILURE_CODES.find((c) => c.value === reasonCode)?.label ?? reasonCode;
          return updatePayout(failing!.id, {
            status: "FAILED",
            failureReason: note ? (reasonCode === "OTHER" ? note : `${label}: ${note}`) : label,
            reason: note || label,
          });
        }}
        onDone={() => toast.success("Payout marked failed")}
      />
      <ReasonDialog
        open={!!cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
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
        onConfirm={({ reasonCode, note }) => {
          const label = CANCEL_CODES.find((c) => c.value === reasonCode)?.label ?? reasonCode;
          const text = note ? (reasonCode === "OTHER" ? note : `${label}: ${note}`) : label;
          return updatePayout(cancelling!.id, { status: "CANCELLED", cancelledReason: text, reason: text });
        }}
        onDone={() => toast.success("Payout cancelled")}
      />
      {dialog}
    </div>
  );
}
