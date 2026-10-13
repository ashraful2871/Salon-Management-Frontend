"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { FileBadge } from "lucide-react";
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
import { PayoutAccountReviewSheet, accountLabel } from "@/components/Admin/finance/PayoutAccountReviewSheet";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api-types";
import { decideKyc } from "@/services/admin/finance/decideKyc";
import { decidePayoutAccount } from "@/services/admin/finance/decidePayoutAccount";
import type {
  AdminKycRow,
  AdminPayoutAccount,
  AdminPayoutAccounts,
  AdminPayoutOwner,
  PayoutAccountStatus,
} from "@/services/admin/finance/payoutAccountTypes";
import { ACCOUNT_TYPE_LABEL, type PayoutAccount } from "@/services/owner/payoutAccountTypes";

export type AccountsTab = PayoutAccountStatus | "KYC";

const TABS: { value: AccountsTab; label: string }[] = [
  { value: "PENDING_VERIFICATION", label: "To verify" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DISABLED", label: "Replaced" },
  { value: "KYC", label: "Business KYC" },
];

const ACCOUNT_REJECT_CODES = [
  { value: "NAME_MISMATCH", label: "Holder's name doesn't match the business" },
  { value: "WRONG_DETAILS", label: "Number or routing details are wrong" },
  { value: "UNVERIFIABLE", label: "Couldn't confirm the account" },
  { value: "OTHER", label: "Other" },
];

const KYC_REJECT_CODES = [
  { value: "LICENCE_INVALID", label: "Trade licence not valid" },
  { value: "NAME_MISMATCH", label: "Legal name doesn't match the licence" },
  { value: "TAX_ID_INVALID", label: "TIN or BIN not valid" },
  { value: "OTHER", label: "Other" },
];

const reasonText = (codes: { value: string; label: string }[], code: string, note: string) => {
  const label = codes.find((c) => c.value === code)?.label ?? code;
  return note ? (code === "OTHER" ? note : `${label}: ${note}`) : label;
};

type Review = { owner: AdminPayoutOwner; account: PayoutAccount | null; replaces: PayoutAccount | null };

export function PayoutAccountsClient({
  tab,
  page,
  accounts,
  kyc,
  canReveal,
}: {
  tab: AccountsTab;
  page: number;
  accounts: ApiResponse<AdminPayoutAccounts>;
  kyc: ApiResponse<AdminKycRow[]> | null;
  canReveal: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [review, setReview] = useState<Review | null>(null);
  const [rejectingAccount, setRejectingAccount] = useState<PayoutAccount | null>(null);
  const [rejectingKyc, setRejectingKyc] = useState<AdminPayoutOwner | null>(null);
  const [busy, startTransition] = useTransition();
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

  const data = accounts.success ? accounts.data : undefined;
  const response = tab === "KYC" ? kyc : accounts;
  const meta = response?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const verifyAccount = (account: PayoutAccount) =>
    startTransition(async () => {
      const result = await run(() => decidePayoutAccount(account.id, { verified: true }));
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(
        result.data?.disabled ? "Account verified; the previous one is disabled" : "Account verified",
      );
      setReview(null);
    });

  const verifyKyc = (owner: AdminPayoutOwner) =>
    startTransition(async () => {
      const result = await run(() => decideKyc(owner.id, { verified: true }));
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Business details verified");
      setReview((r) => (r ? { ...r, owner: result.data ?? r.owner } : r));
    });

  const ownerCell = (owner: AdminPayoutOwner) => (
    <div className="min-w-0">
      <span className="font-medium">{owner.businessName}</span>
      <span className="block truncate text-xs text-muted-foreground">
        {owner.ownerName}
        {owner.isTest ? " · test" : ""}
      </span>
    </div>
  );

  const accountColumns: Column<AdminPayoutAccount>[] = [
    { key: "owner", header: "Business", mobile: "primary", cell: (row) => ownerCell(row.owner) },
    {
      key: "type",
      header: "Type",
      cell: (row) => (row.type === "BANK" ? (row.bankName ?? "Bank") : ACCOUNT_TYPE_LABEL[row.type]),
    },
    {
      key: "number",
      header: "Number",
      mobile: "meta",
      cell: (row) => (
        <div className="text-sm">
          <span className="font-mono tabular-nums">{row.number}</span>
          <span className="block truncate text-xs text-muted-foreground">{row.accountName}</span>
        </div>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (row) => <span className="text-sm text-muted-foreground">{formatDhaka(row.createdAt)}</span>,
    },
    { key: "status", header: "Status", mobile: "trailing", cell: (row) => <ToneBadge status={row.status} /> },
  ];

  const kycColumns: Column<AdminKycRow>[] = [
    { key: "owner", header: "Business", mobile: "primary", cell: (row) => ownerCell(row) },
    { key: "legal", header: "Legal name", cell: (row) => row.kyc.legalName ?? "—" },
    {
      key: "account",
      header: "Payout account",
      mobile: "meta",
      cell: (row) => (row.account ? accountLabel(row.account) : <span className="text-muted-foreground">None verified</span>),
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (row) => <span className="text-sm text-muted-foreground">{formatDhaka(row.submittedAt)}</span>,
    },
    { key: "status", header: "Status", mobile: "trailing", cell: (row) => <ToneBadge status={row.kyc.status} /> },
  ];

  const reviewButton = (onClick: () => void) => (
    <Button variant="ghost" size="sm" onClick={onClick}>
      Review
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout accounts"
        description="New and changed payout accounts to verify before money goes to them, and each business's KYC."
      />

      <nav aria-label="Account status" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map((t) => {
          const count = t.value === "KYC" ? data?.kycSubmitted : data?.statusCounts[t.value];
          const active = t.value === tab;
          return (
            <Link
              key={t.value}
              href={href({ status: t.value, page: null })}
              aria-current={active ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(href({ status: t.value, page: null }));
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-muted",
              )}
            >
              {t.label}
              {count !== undefined && <span className="ml-1.5 tabular-nums opacity-80">{count}</span>}
            </Link>
          );
        })}
      </nav>

      {!response?.success ? (
        <ErrorState message={response?.message} />
      ) : (
        <div className={cn(isPending && "opacity-70")} aria-busy={isPending}>
          {tab === "KYC" ? (
            <DataList
              items={kyc?.data ?? []}
              rowKey={(row) => row.id}
              columns={kycColumns}
              caption="Business KYC awaiting review"
              density="compact"
              empty={<EmptyState icon={FileBadge} title="No KYC to review" />}
              rowActions={(row) =>
                reviewButton(() => setReview({ owner: row, account: row.account, replaces: null }))
              }
            />
          ) : (
            <DataList
              items={data?.items ?? []}
              rowKey={(row) => row.id}
              columns={accountColumns}
              caption="Payout accounts"
              density="compact"
              empty={
                <EmptyState
                  icon={FileBadge}
                  title={tab === "PENDING_VERIFICATION" ? "Nothing to verify" : "No accounts here"}
                />
              }
              rowActions={(row) =>
                reviewButton(() => setReview({ owner: row.owner, account: row, replaces: row.replaces }))
              }
            />
          )}
          {meta && (
            <Pagination
              className="mt-4"
              page={page}
              totalPages={totalPages}
              total={meta.total}
              pageSize={meta.limit}
              itemLabel={tab === "KYC" ? "businesses" : "accounts"}
              disabled={isPending}
              onPageChange={(next) => navigate(href({ page: String(next) }))}
            />
          )}
        </div>
      )}

      <PayoutAccountReviewSheet
        owner={review?.owner ?? null}
        account={review?.account ?? null}
        replaces={review?.replaces ?? null}
        canReveal={canReveal}
        pending={busy}
        onClose={() => setReview(null)}
        onVerifyAccount={verifyAccount}
        onRejectAccount={setRejectingAccount}
        onVerifyKyc={verifyKyc}
        onRejectKyc={setRejectingKyc}
      />
      <ReasonDialog
        open={!!rejectingAccount}
        onOpenChange={(open) => !open && setRejectingAccount(null)}
        title="Reject payout account"
        description={
          rejectingAccount ? `${accountLabel(rejectingAccount)}. The owner gets an email with the reason.` : undefined
        }
        reasonCodes={ACCOUNT_REJECT_CODES}
        confirmLabel="Reject account"
        tone="danger"
        showNotify={false}
        stepUp
        onConfirm={({ reasonCode, note }) =>
          decidePayoutAccount(rejectingAccount!.id, {
            verified: false,
            reason: reasonText(ACCOUNT_REJECT_CODES, reasonCode, note),
          })
        }
        onDone={() => {
          toast.success("Account rejected");
          setReview(null);
        }}
      />
      <ReasonDialog
        open={!!rejectingKyc}
        onOpenChange={(open) => !open && setRejectingKyc(null)}
        title="Reject business details"
        description={rejectingKyc ? `${rejectingKyc.businessName}. The owner gets an email with the reason.` : undefined}
        reasonCodes={KYC_REJECT_CODES}
        confirmLabel="Reject KYC"
        tone="danger"
        showNotify={false}
        stepUp
        onConfirm={({ reasonCode, note }) =>
          decideKyc(rejectingKyc!.id, { verified: false, reason: reasonText(KYC_REJECT_CODES, reasonCode, note) })
        }
        onDone={(result) => {
          toast.success("Business details rejected");
          setReview((r) => (r && result.data ? { ...r, owner: result.data } : r));
        }}
      />
      {dialog}
    </div>
  );
}
