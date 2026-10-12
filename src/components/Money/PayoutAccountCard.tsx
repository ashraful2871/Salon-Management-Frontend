"use client";

import { useState } from "react";
import { Clock, Landmark, Smartphone, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import {
  ACCOUNT_TYPE_LABEL,
  type PayoutAccount,
  type PayoutAccountStatus,
  type PayoutSettings,
} from "@/services/owner/payoutAccountTypes";
import { AddPayoutAccountDialog } from "./AddPayoutAccountDialog";

const STATUS_LABEL: Record<PayoutAccountStatus, string> = {
  PENDING_VERIFICATION: "Waiting for verification",
  VERIFIED: "Verified",
  REJECTED: "Not approved",
  DISABLED: "Replaced",
};

const formatWhen = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

function AccountRow({ account }: { account: PayoutAccount }) {
  const Icon = account.type === "BANK" ? Landmark : Smartphone;
  const cooling = account.cooldownUntil && new Date(account.cooldownUntil) > new Date();

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-subtle p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-hover">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {account.type === "BANK" ? account.bankName : ACCOUNT_TYPE_LABEL[account.type]}{" "}
            <span className="tabular-nums">{account.number}</span>
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {account.accountName}
            {account.type === "BANK" && account.branchName ? ` · ${account.branchName}` : ""}
          </p>
        </div>
        <ToneBadge status={account.status}>{STATUS_LABEL[account.status]}</ToneBadge>
      </div>
      {account.status === "PENDING_VERIFICATION" && (
        <p className="text-sm text-muted-foreground">
          Our finance team checks new accounts, usually within one working day.
        </p>
      )}
      {cooling && (
        <p className="flex items-center gap-1.5 text-sm text-warning">
          <Clock className="size-4 shrink-0" aria-hidden />
          No payouts to this account before {formatWhen(account.cooldownUntil!)}.
        </p>
      )}
      {account.status === "REJECTED" && account.rejectionReason && (
        <p className="text-sm text-danger">Reason: {account.rejectionReason}</p>
      )}
    </div>
  );
}

/** The account payouts go to, plus a pending or rejected replacement. */
export function PayoutAccountCard({ settings }: { settings: PayoutSettings }) {
  const [open, setOpen] = useState(false);
  const verified = settings.accounts.find((a) => a.status === "VERIFIED");
  const pending = settings.accounts.find((a) => a.status === "PENDING_VERIFICATION");
  const rejected = settings.accounts.find((a) => a.status === "REJECTED");
  // A rejection matters only while nothing newer replaced it.
  const showRejected =
    rejected && !pending && (!verified || new Date(rejected.createdAt) > new Date(verified.createdAt));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout account</CardTitle>
        <CardDescription>
          {verified ? "Your payouts are sent here." : "Add where you'd like to be paid."}
        </CardDescription>
        <CardAction>
          <Button size="sm" variant={verified ? "outline" : "default"} onClick={() => setOpen(true)}>
            {verified || pending ? "Change account" : "Add account"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {settings.payoutsFrozen && (
          <p className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Payouts to your business are paused by our finance team. Contact support for details.
          </p>
        )}
        {verified && <AccountRow account={verified} />}
        {pending && <AccountRow account={pending} />}
        {showRejected && <AccountRow account={rejected} />}
        {!verified && !pending && !showRejected && (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No payout account yet. Your earnings stay in your balance until you add one and it is
            verified.
          </p>
        )}
        {verified && pending && (
          <p className="text-sm text-muted-foreground">
            Payouts keep going to your verified account until the new one is checked.
          </p>
        )}
      </CardContent>
      {open && (
        <AddPayoutAccountDialog
          open={open}
          onOpenChange={setOpen}
          codeEmail={settings.codeEmail}
          totpRequired={settings.totpRequired}
          cooldownHours={verified ? settings.cooldownHours : 0}
        />
      )}
    </Card>
  );
}
