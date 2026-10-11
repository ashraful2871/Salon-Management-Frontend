"use client";

import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImpactPreview, type Impact } from "@/components/Admin/ImpactPreview";
import { ReasonDialog } from "@/components/Admin/ReasonDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { getUserImpact } from "@/services/admin/users/getUserImpact";
import { updateUserStatus } from "@/services/admin/users/updateUserStatus";
import type { UserImpact } from "@/services/admin/users/types";
import { REACTIVATE_REASONS, STATUS_REASONS } from "./labels";

export type StatusAction = "SUSPENDED" | "BLOCKED" | "ACTIVE";

const TITLES: Record<StatusAction, string> = {
  SUSPENDED: "Suspend",
  BLOCKED: "Block",
  ACTIVE: "Reactivate",
};

const PAST: Record<StatusAction, string> = {
  SUSPENDED: "Suspended",
  BLOCKED: "Blocked",
  ACTIVE: "Reactivated",
};

/** Bulk suspend stops here; anything bigger is a job for support tooling. */
export const BULK_LIMIT = 50;

/**
 * Suspend, block or reactivate one account or (suspend only) up to 50. For a
 * single account the impact is read when the dialog opens and the optional
 * consequences (cancel upcoming bookings, take salons offline) are ticked in.
 * Mount it only while open (`{open && <StatusDialog open … />}`), so every
 * opening starts from the defaults.
 */
export function StatusDialog({
  open,
  onOpenChange,
  action,
  users,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: StatusAction;
  users: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const ids = useId();
  const single = users.length === 1 ? users[0] : null;
  const singleId = single?.id;
  const [impact, setImpact] = useState<UserImpact | null>(null);
  const [until, setUntil] = useState("");
  // Tomorrow, read once: a suspension "until" today would lift at once.
  const [minDay] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [cancelUpcoming, setCancelUpcoming] = useState(true);
  const [suspendSalons, setSuspendSalons] = useState(false);
  const restricting = action !== "ACTIVE";

  useEffect(() => {
    if (!open || !singleId || !restricting) return;
    let live = true;
    void getUserImpact(singleId).then((r) => {
      if (live && r.success && r.data) setImpact(r.data);
    });
    return () => {
      live = false;
    };
  }, [open, singleId, restricting]);

  const items: Impact[] = [];
  if (restricting) {
    if (!single || (impact?.upcomingBookings ?? 0) > 0) {
      items.push({
        key: "cancelUpcoming",
        label: single
          ? `Cancel ${impact?.upcomingBookings} upcoming booking${impact?.upcomingBookings === 1 ? "" : "s"}`
          : "Cancel their upcoming bookings",
        detail:
          single && impact?.heldDepositsMinor
            ? `${formatBDT(impact.heldDepositsMinor)} in deposits goes back to their wallet`
            : "Deposits go back to their wallets in full",
        checked: cancelUpcoming,
      });
    }
    if (single && (impact?.ownedSalons ?? 0) > 0) {
      items.push({
        key: "suspendSalons",
        label: `Take ${impact?.ownedSalons} salon${impact?.ownedSalons === 1 ? "" : "s"} offline`,
        detail: impact?.salons.map((s) => s.name).join(", "),
        checked: suspendSalons,
      });
    }
    items.push({ key: "signout", label: "Sign them out everywhere" });
  }

  const extra = restricting ? (
    <div className="space-y-4">
      {action === "SUSPENDED" && (
        <div className="space-y-1.5">
          <Label htmlFor={`${ids}-until`}>Until (optional)</Label>
          <Input
            id={`${ids}-until`}
            type="date"
            value={until}
            min={minDay}
            onChange={(e) => setUntil(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Empty means until someone reactivates it. A date lifts it at the start of that day.
          </p>
        </div>
      )}
      {single && restricting && !impact ? (
        <p className="text-sm text-muted-foreground">Checking bookings and salons…</p>
      ) : (
        <ImpactPreview
          items={items}
          onCheckedChange={(key, checked) => {
            if (key === "cancelUpcoming") setCancelUpcoming(checked);
            if (key === "suspendSalons") setSuspendSalons(checked);
          }}
        />
      )}
    </div>
  ) : undefined;

  const confirm = async (input: { reasonCode: string; note: string; notify: boolean }) => {
    const payload = {
      status: action,
      reasonCode: input.reasonCode,
      note: input.note || undefined,
      notify: input.notify,
      ...(action === "SUSPENDED" && until ? { until: `${until}T00:00:00+06:00` } : {}),
      ...(restricting ? { cancelUpcoming, suspendSalons: !!single && suspendSalons } : {}),
    };

    if (single) {
      const result = await updateUserStatus(single.id, payload);
      if (result.success && result.data?.cancelFailed) {
        return {
          ...result,
          message: `${result.message}. ${result.data.cancelFailed} booking(s) could not be cancelled; check them by hand.`,
        };
      }
      return result;
    }

    // One at a time, so the audit log and the emails stay in order.
    let done = 0;
    const failed: string[] = [];
    for (const user of users) {
      const result = await updateUserStatus(user.id, payload);
      if (result.success) done++;
      else failed.push(`${user.name}: ${result.message}`);
    }
    const result: ApiResponse = {
      success: done > 0,
      message:
        failed.length === 0
          ? `${PAST[action]} ${done} account${done === 1 ? "" : "s"}`
          : `${done} done, ${failed.length} failed. ${failed.slice(0, 3).join("; ")}`,
    };
    return result;
  };

  return (
    <ReasonDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${TITLES[action]} ${single ? single.name : `${users.length} accounts`}`}
      description={
        action === "ACTIVE"
          ? "They can sign in and book again."
          : action === "SUSPENDED"
            ? "They can't sign in or book while suspended."
            : "They can't sign in or book. Blocking is meant to be permanent."
      }
      impact={extra}
      reasonCodes={restricting ? STATUS_REASONS : REACTIVATE_REASONS}
      confirmLabel={TITLES[action]}
      tone={restricting ? "danger" : "default"}
      onConfirm={confirm}
      onDone={(result) => {
        showResultToast(result);
        onDone?.();
      }}
    />
  );
}
