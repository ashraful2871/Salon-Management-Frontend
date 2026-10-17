"use client";

import { useId, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/Shared/ResponsiveDialog";
import { showResultToast } from "@/components/Shared/showResultToast";
import { reopenDailyClose } from "@/services/owner/dailyCloseActions";

/** Owner only: delete a day's close (audited with the reason) so the desk can count again. */
export const ReopenCloseButton = ({ closeId }: { closeId: string }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reasonId = useId();

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason("");
      setError(null);
    }
    setOpen(next);
  };

  const confirm = () =>
    startTransition(async () => {
      const result = await reopenDailyClose(closeId, reason.trim());
      showResultToast(result, "Day reopened", "Couldn't reopen the day");
      if (result.success) handleOpenChange(false);
      else setError(result.message);
    });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Reopen day
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Reopen this day?"
        description="The close is removed and the desk can count the till again. The reason goes on the activity log."
        footer={
          <>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={pending || reason.trim().length < 3}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Reopen
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor={reasonId}>Reason</Label>
          <Textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="e.g. Miscounted - a ৳500 note was in the card slip box"
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </ResponsiveDialog>
    </>
  );
};
