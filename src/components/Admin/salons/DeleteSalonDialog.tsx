"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStepUp } from "@/components/Admin/StepUpDialog";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { deleteAdminSalon } from "@/services/admin/salons/deleteAdminSalon";

/**
 * Soft-deletes a salon (tier 3): type its name and a reason, then the 2FA
 * step-up if it has lapsed. The API refuses while upcoming bookings exist.
 */
export function DeleteSalonDialog({
  open,
  onOpenChange,
  salon,
  upcomingBookings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salon: { id: string; name: string };
  upcomingBookings: number | null;
}) {
  const ids = useId();
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { run, dialog } = useStepUp();

  const matches = typed.trim().toLowerCase() === salon.name.trim().toLowerCase();
  const ready = matches && reason.trim().length >= 3;

  const submit = () => {
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await run(() => deleteAdminSalon(salon.id, reason.trim(), typed.trim()));
      if (!result.success) {
        setError(result.message);
        return;
      }
      showResultToast(result);
      onOpenChange(false);
      router.push("/dashboard/admin/salons?status=ALL");
    });
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(next) => !pending && onOpenChange(next)}
        title={`Delete ${salon.name}`}
        description="The salon disappears from the site and the owner's dashboard. Its bookings, reviews and money records stay."
        footer={
          <>
            <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="text-white" disabled={!ready || pending} onClick={submit}>
              {pending && <Loader2 aria-hidden className="animate-spin" />}
              Delete salon
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!!upcomingBookings && (
            <p className="rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-sm text-warning">
              {upcomingBookings} upcoming booking{upcomingBookings === 1 ? "" : "s"} still stand. Cancel them first
              (Actions → Cancel upcoming bookings), or the delete is refused.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-name`}>
              Type <span className="font-semibold">{salon.name}</span> to confirm
            </Label>
            <Input id={`${ids}-name`} autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-reason`}>Reason</Label>
            <Input
              id={`${ids}-reason`}
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </ResponsiveDialog>
      {dialog}
    </>
  );
}
