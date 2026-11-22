"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, Gift, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { reasonText } from "@/components/Admin/users/labels";
import CopyButton from "@/components/Wallet/CopyButton";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { showResultToast } from "@/components/Shared/showResultToast";
import { can } from "@/lib/admin-permissions";
import { formatBDT } from "@/lib/money";
import type { AdminUserReferral } from "@/services/admin/users/types";
import { blockReferralUser } from "@/services/referral/blockReferralUser";
import { resetReferralCode } from "@/services/referral/resetReferralCode";
import { unblockReferralUser } from "@/services/referral/unblockReferralUser";
import { GrantRewardDialog, type GrantDefaults } from "./GrantRewardDialog";
import { BLOCK_REASONS, REFERRAL_STATUS_LABELS, RESET_REASONS, UNBLOCK_REASONS } from "./labels";
import { Fact } from "./ReferralParts";

type Dialog = "reset" | "block" | "unblock" | "grant" | null;

/**
 * User 360's Referrals card (referrals.view): the code, blocked state, who
 * referred them, what they've made and saved. With referrals.manage: reset
 * the code, block / unblock, grant a reward; all tier 3 (step-up).
 */
export function ReferralUserCard({
  user,
  referral,
  permissions,
  grantDefaults,
}: {
  user: { id: string; name: string };
  referral: AdminUserReferral;
  permissions: string[];
  grantDefaults: GrantDefaults;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const canManage = can(permissions, "referrals.manage");
  const close = (next: boolean) => !next && setDialog(null);

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          Referrals
          <Link href={`/dashboard/admin/referrals/list?q=${encodeURIComponent(referral.code ?? user.name)}`} className="text-xs font-normal text-primary hover:underline">
            Open in Referrals
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="divide-y divide-border">
          <Fact label="Code">
            {referral.code ? (
              <span className="inline-flex items-center gap-1">
                <code className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-xs">{referral.code}</code>
                <CopyButton value={referral.code} label="Referral code" />
              </span>
            ) : (
              <span className="text-muted-foreground">Not made yet</span>
            )}
          </Fact>
          <Fact label="Program">
            {referral.blocked ? (
              <span className="inline-flex flex-col items-end gap-0.5">
                <ToneBadge status="BLOCKED">Blocked</ToneBadge>
                {referral.blockedReason && <span className="text-xs text-muted-foreground">{referral.blockedReason}</span>}
              </span>
            ) : (
              <ToneBadge status="ACTIVE">Can refer</ToneBadge>
            )}
          </Fact>
          <Fact label="Referred by">
            {referral.referredBy ? (
              <span>
                <Link href={`/dashboard/admin/users/${referral.referredBy.id}`} className="text-primary hover:underline">
                  {referral.referredBy.name}
                </Link>{" "}
                <Link
                  href={`/dashboard/admin/referrals/list?open=${encodeURIComponent(referral.referredBy.referralId)}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  ({REFERRAL_STATUS_LABELS[referral.referredBy.status as keyof typeof REFERRAL_STATUS_LABELS] ?? referral.referredBy.status})
                </Link>
              </span>
            ) : (
              <span className="text-muted-foreground">Nobody</span>
            )}
          </Fact>
          <Fact label="Referrals made">
            {referral.made.total} total · {referral.made.qualified} qualified
          </Fact>
          <Fact label="Rewards">
            {referral.rewards.available} available · {referral.rewards.redeemed} redeemed
          </Fact>
          <Fact label="Saved">{formatBDT(referral.rewards.savedMinor)}</Fact>
        </dl>

        {canManage && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button size="sm" onClick={() => setDialog("grant")}>
              <Gift aria-hidden /> Grant reward
            </Button>
            {referral.code && (
              <Button size="sm" variant="outline" onClick={() => setDialog("reset")}>
                <RotateCcw aria-hidden /> Reset code
              </Button>
            )}
            {referral.blocked ? (
              <Button size="sm" variant="outline" onClick={() => setDialog("unblock")}>
                <ShieldCheck aria-hidden /> Unblock
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setDialog("block")}>
                <Ban aria-hidden /> Block from program
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {dialog === "reset" && (
        <ReasonDialog
          open
          onOpenChange={close}
          title={`Reset ${user.name}'s code`}
          description="A new code is made and the old one stops working at once; links already shared stop attaching."
          reasonCodes={RESET_REASONS}
          confirmLabel="Reset code"
          showNotify={false}
          stepUp
          onConfirm={(input) => resetReferralCode(user.id, reasonText(RESET_REASONS, input))}
          onDone={showResultToast}
        />
      )}
      {dialog === "block" && (
        <ReasonDialog
          open
          onOpenChange={close}
          title={`Block ${user.name} from referrals`}
          description="Their code stops working, their referrals no longer qualify, and any held referrer reward is rejected. Rewards they already have keep working."
          reasonCodes={BLOCK_REASONS}
          confirmLabel="Block"
          tone="danger"
          showNotify={false}
          stepUp
          onConfirm={(input) => blockReferralUser(user.id, reasonText(BLOCK_REASONS, input))}
          onDone={showResultToast}
        />
      )}
      {dialog === "unblock" && (
        <ReasonDialog
          open
          onOpenChange={close}
          title={`Unblock ${user.name}`}
          description="Their code works again for new friends. Referrals rejected while blocked stay rejected."
          reasonCodes={UNBLOCK_REASONS}
          confirmLabel="Unblock"
          showNotify={false}
          stepUp
          onConfirm={(input) => unblockReferralUser(user.id, reasonText(UNBLOCK_REASONS, input))}
          onDone={showResultToast}
        />
      )}
      <GrantRewardDialog
        open={dialog === "grant"}
        onOpenChange={close}
        defaults={grantDefaults}
        user={{ id: user.id, name: user.name }}
      />
    </Card>
  );
}
