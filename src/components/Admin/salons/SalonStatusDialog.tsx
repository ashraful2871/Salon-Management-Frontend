"use client";

import { useEffect, useState } from "react";
import { ImpactPreview, type Impact } from "@/components/Admin/ImpactPreview";
import { ReasonDialog, type ReasonInput } from "@/components/Admin/ReasonDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import type { ApiResponse } from "@/lib/api-types";
import { formatBDT } from "@/lib/money";
import { cancelSalonUpcoming } from "@/services/admin/salons/cancelSalonUpcoming";
import { getSalonImpact } from "@/services/admin/salons/getSalonImpact";
import { updateAdminSalonStatus } from "@/services/admin/salons/updateAdminSalonStatus";
import type { SalonImpact, SalonStatusResult } from "@/services/admin/salons/types";
import { SALON_REASONS } from "./labels";

export type SalonReasonAction = "REJECTED" | "SUSPENDED" | "INACTIVE";

const COPY: Record<SalonReasonAction, { title: string; confirm: string; description: string }> = {
  REJECTED: {
    title: "Reject",
    confirm: "Reject",
    description: "The owner gets the reason and a link to fix and resubmit.",
  },
  SUSPENDED: {
    title: "Suspend",
    confirm: "Suspend",
    description: "Hidden from the salon list, the map, AI search and the assistant; nobody can book it.",
  },
  INACTIVE: {
    title: "Set inactive",
    confirm: "Set inactive",
    description: "Hidden everywhere like a suspension, without telling the owner it is a penalty.",
  },
};

/**
 * Reject, suspend or deactivate one salon with a reason code. A suspension
 * reads the impact when it opens and offers to cancel the upcoming bookings
 * (deposit back plus goodwill credit); that part is tier 3, so the dialog runs
 * through step-up. Mount it only while open, so every opening starts fresh.
 */
export function SalonStatusDialog({
  open,
  onOpenChange,
  action,
  salon,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: SalonReasonAction;
  salon: { id: string; name: string };
  onDone?: (result: ApiResponse<SalonStatusResult>) => void;
}) {
  const hidesSalon = action !== "REJECTED";
  const [impact, setImpact] = useState<SalonImpact | null>(null);
  const [cancelUpcoming, setCancelUpcoming] = useState(true);

  useEffect(() => {
    if (!open || !hidesSalon) return;
    let live = true;
    void getSalonImpact(salon.id).then((r) => {
      if (live && r.success && r.data) setImpact(r.data);
    });
    return () => {
      live = false;
    };
  }, [open, hidesSalon, salon.id]);

  const items: Impact[] = [];
  if (hidesSalon && impact) {
    if (impact.upcomingBookings > 0) {
      items.push({
        key: "cancelUpcoming",
        label: `Cancel ${impact.upcomingBookings} upcoming booking${impact.upcomingBookings === 1 ? "" : "s"} and return deposits`,
        detail: impact.heldDepositsMinor
          ? `${formatBDT(impact.heldDepositsMinor)} back to customers, plus the goodwill credit`
          : "Customers get the goodwill credit and an email",
        checked: cancelUpcoming,
      });
    }
    items.push({ key: "hidden", label: "Hide it from search, the map and AI search" });
    if (impact.payableMinor > 0) {
      items.push({
        key: "payable",
        label: `${formatBDT(impact.payableMinor)} stays owed to the owner`,
        detail: "Payouts are not touched.",
      });
    }
  }

  const willCancel = hidesSalon && cancelUpcoming && (impact?.upcomingBookings ?? 0) > 0;

  const confirm = async (input: ReasonInput): Promise<ApiResponse<SalonStatusResult>> => {
    // Bookings first: that call is the one that may ask for step-up, and a
    // retry must not hit an already-suspended salon.
    let cancelNote = "";
    if (willCancel) {
      const label = SALON_REASONS.find((r) => r.value === input.reasonCode)?.label ?? input.reasonCode;
      const cancelled = await cancelSalonUpcoming(salon.id, input.note ? `${label}: ${input.note}` : label);
      if (!cancelled.success) return cancelled as ApiResponse<never>;
      if (cancelled.data) {
        cancelNote = ` · ${cancelled.data.cancelled} booking(s) cancelled${cancelled.data.failed ? `, ${cancelled.data.failed} failed - check them by hand` : ""}`;
      }
    }
    const result = await updateAdminSalonStatus(salon.id, {
      status: action,
      reasonCode: input.reasonCode,
      note: input.note || undefined,
      notify: input.notify,
    });
    return result.success ? { ...result, message: `${result.message}${cancelNote}` } : result;
  };

  return (
    <ReasonDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${COPY[action].title} ${salon.name}`}
      description={COPY[action].description}
      impact={
        hidesSalon ? (
          impact ? (
            <ImpactPreview
              items={items}
              onCheckedChange={(key, checked) => {
                if (key === "cancelUpcoming") setCancelUpcoming(checked);
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Checking bookings and balance…</p>
          )
        ) : undefined
      }
      reasonCodes={SALON_REASONS}
      confirmLabel={COPY[action].confirm}
      tone="danger"
      notifyLabel="Email the owner"
      showNotify={action !== "INACTIVE"}
      defaultNotify={action !== "INACTIVE"}
      stepUp={willCancel}
      onConfirm={confirm}
      onDone={(result) => {
        showResultToast(result);
        onDone?.(result);
      }}
    />
  );
}
