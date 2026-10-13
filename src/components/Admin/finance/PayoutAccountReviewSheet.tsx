"use client";

import { useState, useTransition } from "react";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDhaka } from "@/components/Admin/Timeline";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { revealPayoutAccount } from "@/services/admin/finance/revealPayoutAccount";
import type { AdminPayoutOwner } from "@/services/admin/finance/payoutAccountTypes";
import { ACCOUNT_TYPE_LABEL, type PayoutAccount } from "@/services/owner/payoutAccountTypes";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[8.5rem_1fr] gap-2 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words">{children ?? <span className="text-muted-foreground">—</span>}</dd>
  </div>
);

export const accountLabel = (account: PayoutAccount) =>
  `${account.type === "BANK" ? (account.bankName ?? "Bank") : ACCOUNT_TYPE_LABEL[account.type]} ${account.number}`;

/** The account number, masked until a PII-holder asks for it (audited). */
function AccountNumber({ account, canReveal }: { account: PayoutAccount; canReveal: boolean }) {
  const [full, setFull] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-mono tabular-nums">{full ?? account.number}</span>
      {canReveal && !full && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await revealPayoutAccount(account.id);
              if (result.success && result.data?.number) setFull(result.data.number);
              else toast.error(result.message);
            })
          }
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
          Reveal
        </Button>
      )}
    </span>
  );
}

function AccountDetails({ account, canReveal }: { account: PayoutAccount; canReveal: boolean }) {
  return (
    <dl className="space-y-2">
      <Field label="Type">{ACCOUNT_TYPE_LABEL[account.type]}</Field>
      <Field label="Holder">{account.accountName}</Field>
      <Field label={account.type === "BANK" ? "Account no." : "Wallet no."}>
        <AccountNumber account={account} canReveal={canReveal} />
      </Field>
      {account.type === "BANK" && (
        <>
          <Field label="Bank">{account.bankName}</Field>
          <Field label="Branch">{account.branchName}</Field>
          <Field label="Routing no.">
            {account.routingNumber && <span className="font-mono">{account.routingNumber}</span>}
          </Field>
        </>
      )}
      <Field label="Submitted">{formatDhaka(account.createdAt)}</Field>
      {account.cooldownUntil && <Field label="Cooldown until">{formatDhaka(account.cooldownUntil)}</Field>}
      {account.verifiedAt && <Field label="Verified">{formatDhaka(account.verifiedAt)}</Field>}
      {account.rejectionReason && <Field label="Reason">{account.rejectionReason}</Field>}
    </dl>
  );
}

/**
 * One business's payout account and KYC, with Verify / Reject for each. The
 * reject dialogs live in the parent, as on the salon review sheet.
 */
export function PayoutAccountReviewSheet({
  owner,
  account,
  replaces,
  canReveal,
  pending,
  onClose,
  onVerifyAccount,
  onRejectAccount,
  onVerifyKyc,
  onRejectKyc,
}: {
  owner: AdminPayoutOwner | null;
  account: PayoutAccount | null;
  replaces: PayoutAccount | null;
  canReveal: boolean;
  pending: boolean;
  onClose: () => void;
  onVerifyAccount: (account: PayoutAccount) => void;
  onRejectAccount: (account: PayoutAccount) => void;
  onVerifyKyc: (owner: AdminPayoutOwner) => void;
  onRejectKyc: (owner: AdminPayoutOwner) => void;
}) {
  const reviewable = account?.status === "PENDING_VERIFICATION";
  const kycReviewable = owner?.kyc.status === "SUBMITTED";

  return (
    <Sheet open={!!owner} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex h-dvh w-full max-w-none flex-col gap-0 p-0 sm:max-w-xl">
        {owner && (
          <>
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <SheetTitle className="truncate pr-8">{owner.businessName}</SheetTitle>
              <SheetDescription className="truncate">
                {owner.ownerName} · {owner.email}
                {owner.isTest ? " · test" : ""}
              </SheetDescription>
              {owner.payoutsFrozen && (
                <div>
                  <ToneBadge status="SUSPENDED">Payouts frozen</ToneBadge>
                </div>
              )}
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
              {account && (
                <section aria-labelledby="pa-account" className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 id="pa-account" className="font-semibold">
                      Payout account
                    </h3>
                    <ToneBadge status={account.status} />
                  </div>
                  <AccountDetails account={account} canReveal={canReveal} />
                  {replaces && (
                    <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
                      Replaces the verified {accountLabel(replaces)}, which is disabled when this one is
                      verified.
                    </p>
                  )}
                  {reviewable && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" disabled={pending} onClick={() => onRejectAccount(account)}>
                        Reject…
                      </Button>
                      <Button disabled={pending} onClick={() => onVerifyAccount(account)}>
                        {pending && <Loader2 className="animate-spin" aria-hidden />}
                        Verify account
                      </Button>
                    </div>
                  )}
                </section>
              )}

              <section aria-labelledby="pa-kyc" className="space-y-3 border-t border-border pt-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 id="pa-kyc" className="font-semibold">
                    Business KYC
                  </h3>
                  <ToneBadge status={owner.kyc.status === "NONE" ? "INACTIVE" : owner.kyc.status}>
                    {owner.kyc.status === "NONE" ? "Not submitted" : undefined}
                  </ToneBadge>
                </div>
                <dl className="space-y-2">
                  <Field label="Legal name">{owner.kyc.legalName}</Field>
                  <Field label="Trade licence">{owner.kyc.tradeLicenseNo}</Field>
                  <Field label="TIN">{owner.kyc.tin}</Field>
                  <Field label="BIN">{owner.kyc.bin}</Field>
                  <Field label="NID (last 4)">{owner.kyc.nidLast4}</Field>
                  {owner.kyc.note && <Field label="Note">{owner.kyc.note}</Field>}
                </dl>
              </section>
            </div>

            {kycReviewable && (
              <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-3">
                <Button variant="outline" disabled={pending} onClick={() => onRejectKyc(owner)}>
                  Reject KYC…
                </Button>
                <Button variant="secondary" disabled={pending} onClick={() => onVerifyKyc(owner)}>
                  Verify KYC
                </Button>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
